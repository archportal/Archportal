// app/api/stripe/success/route.js
//
// Redirect destination después del checkout de Stripe.
// Lee pending_registrations, crea el user en Supabase Auth con el password
// que eligió el usuario en el registro (leído de password_temp), borra
// inmediatamente el plaintext, y redirige al landing con ?payment=success.
//
// El email de bienvenida lo manda el cliente (HomeClient.js) usando EmailJS
// cuando detecta ?payment=success — esta route ya no manda emails.

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://archportal.net'

const toISO = (unixTs) => unixTs ? new Date(unixTs * 1000).toISOString() : null

export async function GET(request) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id')

  if (!sessionId) {
    console.error('[success] missing session_id')
    return NextResponse.redirect(`${APP_URL}?payment=error`)
  }

  try {
    // Expand subscription para tener todo en una llamada (importante con trial)
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    console.log('[success] session retrieved:', {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
    })

    if (session.status !== 'complete') {
      console.warn('[success] session not complete')
      return NextResponse.redirect(`${APP_URL}?payment=cancelled`)
    }

    const pendingId = session.metadata?.pending_id
    if (!pendingId) {
      console.error('[success] missing pending_id in metadata')
      return NextResponse.redirect(`${APP_URL}?payment=error`)
    }

    const { data: pending, error: pendingErr } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('id', pendingId)
      .maybeSingle()

    if (pendingErr || !pending) {
      console.error('[success] pending not found:', pendingId, pendingErr)
      return NextResponse.redirect(`${APP_URL}?payment=error`)
    }

    if (pending.consumed_at) {
      console.log('[success] pending already consumed')
      return NextResponse.redirect(`${APP_URL}?payment=success&email=${encodeURIComponent(pending.email)}`)
    }

    if (!pending.password_temp) {
      console.error('[success] password_temp missing — cannot create user')
      return NextResponse.redirect(`${APP_URL}?payment=error`)
    }

    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id
    const subscription = typeof session.subscription === 'object' ? session.subscription : null
    const subscriptionId = subscription?.id ||
      (typeof session.subscription === 'string' ? session.subscription : null)

    if (!customerId) {
      console.error('[success] missing customer id in session')
      return NextResponse.redirect(`${APP_URL}?payment=error`)
    }

    console.log('[success] customer:', customerId, 'subscription:', subscriptionId)

    // Crear auth user con el password REAL del registro (de password_temp)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: pending.email,
      password: pending.password_temp,
      email_confirm: true,
    })
    if (authError) {
      console.error('[success] auth.admin.createUser failed:', authError)
      throw authError
    }
    console.log('[success] auth user created:', authUser.user.id)

    // Insertar/actualizar en users con todos los campos de subscription
    const userPayload = {
      id: authUser.user.id,
      email: pending.email,
      name: pending.nombre,
      role: 'arq',
      plan: pending.plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId || null,
    }

    if (subscription) {
      userPayload.subscription_status = subscription.status
      userPayload.trial_end = toISO(subscription.trial_end)
      userPayload.current_period_end = toISO(subscription.current_period_end)
      userPayload.cancel_at_period_end = subscription.cancel_at_period_end || false
    }

    const { error: insertError } = await supabaseAdmin
      .from('users')
      .upsert(userPayload, { onConflict: 'id' })

    if (insertError) {
      console.error('[success] users upsert failed:', insertError)
      try { await supabaseAdmin.auth.admin.deleteUser(authUser.user.id) } catch {}
      throw insertError
    }
    console.log('[success] users row created/updated')

    // Crear primer proyecto
    const { data: project, error: projectError } = await supabaseAdmin.from('projects').insert({
      user_id: authUser.user.id,
      nombre: (pending.despacho || pending.nombre) + ' - Proyecto 1',
      cliente: '',
      ubicacion: pending.ciudad || '',
      arquitecto: pending.nombre,
      presupuesto: 0,
      pres_ejercido: 0,
      pres_pagado: 0,
      etapa_actual: 'Por iniciar',
      architect_email: pending.email,
    }).select().single()

    if (projectError) {
      console.error('[success] project insert failed:', projectError)
    } else if (project) {
      const { error: stageError } = await supabaseAdmin.from('project_stages').insert({
        project_id: project.id,
        nombre: 'Proyecto arquitectonico',
        porcentaje: 0,
        fechas: 'Por definir',
        estatus: 'Pendiente',
        orden: 0,
      })
      if (stageError) console.warn('[success] stage insert warning:', stageError)
    }

    // Marcar pending como consumido y BORRAR el password_temp y password_hash
    // — ya no se necesitan, el user ya está creado con su password en Supabase Auth.
    await supabaseAdmin
      .from('pending_registrations')
      .update({
        consumed_at: new Date().toISOString(),
        password_temp: null,
        password_hash: '',
      })
      .eq('id', pendingId)

    console.log('[success] flow complete for', pending.email)

    // Redirige con email + nombre + plan en query params para que HomeClient
    // pueda mandar el email de bienvenida con EmailJS y mostrar mensaje personalizado
    const params = new URLSearchParams({
      payment: 'success',
      email: pending.email,
      nombre: pending.nombre,
      plan: pending.plan,
    })
    return NextResponse.redirect(`${APP_URL}?${params.toString()}`)

  } catch (error) {
    console.error('[success] handler error:', error)
    return NextResponse.redirect(`${APP_URL}?payment=error`)
  }
}
