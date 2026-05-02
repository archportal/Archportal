// app/api/stripe/success/route.js
//
// Redirect destination después del checkout de Stripe (con o sin trial).
// Lee pending_registrations por el ID en metadata, crea el user real,
// y borra el pending. Después redirige al landing con ?payment=success.
//
// IMPORTANTE: el webhook de Stripe puede llegar antes que este redirect
// (race condition). Por eso usamos UPSERT en lugar de INSERT, así si el
// webhook ya creó el user, simplemente actualizamos en lugar de duplicar.

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://archportal.net'

export async function GET(request) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id')

  if (!sessionId) {
    console.error('[success] missing session_id')
    return NextResponse.redirect(`${APP_URL}?payment=error`)
  }

  try {
    // CRÍTICO: expand subscription para que session.subscription venga lleno (no como id),
    // especialmente importante en flujos con trial_period_days donde tarda en propagarse.
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    console.log('[success] session retrieved:', {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      customer: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      subscription: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
      mode: session.mode,
    })

    // Aceptamos status:complete (es lo que pasa con trial). payment_status puede ser
    // 'paid' (sin trial) o 'no_payment_required' (con trial).
    if (session.status !== 'complete') {
      console.warn('[success] session not complete, redirecting to cancelled')
      return NextResponse.redirect(`${APP_URL}?payment=cancelled`)
    }

    const pendingId = session.metadata?.pending_id
    if (!pendingId) {
      console.error('[success] missing pending_id in session metadata:', sessionId)
      return NextResponse.redirect(`${APP_URL}?payment=error`)
    }

    // Buscar el pending registration
    const { data: pending, error: pendingErr } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('id', pendingId)
      .maybeSingle()

    if (pendingErr) {
      console.error('[success] error fetching pending:', pendingErr)
      return NextResponse.redirect(`${APP_URL}?payment=error`)
    }
    if (!pending) {
      console.error('[success] pending registration not found:', pendingId)
      return NextResponse.redirect(`${APP_URL}?payment=error`)
    }

    // Idempotencia: si ya fue consumido, no recrear
    if (pending.consumed_at) {
      console.log('[success] pending already consumed, redirecting')
      return NextResponse.redirect(`${APP_URL}?payment=success`)
    }

    // Extraer customer_id y subscription_id de la session
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

    if (!customerId) {
      console.error('[success] missing customer in session — this should never happen')
      return NextResponse.redirect(`${APP_URL}?payment=error`)
    }

    // Crear user en Supabase Auth con password aleatorio temporal.
    // El usuario establecerá su password real desde el email de "establece contraseña".
    const tempPassword = crypto.randomBytes(32).toString('hex')

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: pending.email,
      password: tempPassword,
      email_confirm: true,
    })
    if (authError) {
      console.error('[success] auth.admin.createUser failed:', authError)
      throw authError
    }
    console.log('[success] auth user created:', authUser.user.id)

    // UPSERT en users — si el webhook ya creó el row, actualizamos; si no, insertamos
    const userPayload = {
      id: authUser.user.id,
      email: pending.email,
      name: pending.nombre,
      role: 'arq',
      plan: pending.plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId || null,
    }

    const { error: insertError } = await supabaseAdmin
      .from('users')
      .upsert(userPayload, { onConflict: 'id' })

    if (insertError) {
      console.error('[success] users insert/upsert failed:', insertError)
      // Rollback: borrar el auth user creado
      try { await supabaseAdmin.auth.admin.deleteUser(authUser.user.id) } catch {}
      throw insertError
    }
    console.log('[success] users row created/updated for', pending.email)

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
      // No hacemos rollback total — el user ya está, sigue al login
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

    // Marcar pending como consumido
    await supabaseAdmin
      .from('pending_registrations')
      .update({ consumed_at: new Date().toISOString(), password_hash: '' })
      .eq('id', pendingId)

    // Mandar email "establece tu contraseña"
    if (process.env.RESEND_API_KEY) {
      try {
        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: pending.email,
          options: { redirectTo: `${APP_URL}/reset-password` },
        })

        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'ArchPortal <noreply@archportal.net>',
          to: pending.email,
          subject: 'Bienvenido a ArchPortal — Establece tu contraseña',
          html: `
            <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#F5F4F1;padding:48px 24px;">
              <div style="background:#fff;border:1px solid #E2E1DC;padding:48px;">
                <p style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#6B6A62;margin:0 0 24px;">Cuenta activada</p>
                <h1 style="font-family:Georgia,serif;font-size:32px;font-weight:400;color:#0C0C0C;margin:0 0 24px;">Bienvenido, ${pending.nombre}</h1>
                <p style="font-size:14px;color:#3D3C36;line-height:1.8;margin:0 0 24px;">
                  Tu cuenta está activa. Para acceder al portal, establece tu contraseña haciendo click abajo.
                  Por seguridad, este link expira en 1 hora.
                </p>
                <a href="${linkData?.properties?.action_link || APP_URL}" style="display:inline-block;padding:14px 32px;background:#0C0C0C;color:#fff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;">Establecer contraseña</a>
                <p style="font-size:12px;color:#9A9990;margin-top:32px;">Plan activado: <strong>${pending.plan}</strong></p>
              </div>
              <p style="text-align:center;margin-top:24px;font-size:11px;color:#9A9990;">ArchPortal — Portal para despachos de arquitectura</p>
            </div>`,
        })
        console.log('[success] welcome email sent to', pending.email)
      } catch (emailErr) {
        console.warn('[success] welcome email failed (non-fatal):', emailErr.message)
      }
    } else {
      console.warn('[success] RESEND_API_KEY not configured, skipping welcome email')
    }

    return NextResponse.redirect(`${APP_URL}?payment=success`)

  } catch (error) {
    console.error('[success] handler error:', error)
    return NextResponse.redirect(`${APP_URL}?payment=error`)
  }
}
