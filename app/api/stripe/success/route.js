// app/api/stripe/success/route.js
//
// Webhook/redirect destination después del pago exitoso de Stripe.
// Lee pending_registrations por el ID en metadata, crea el user real,
// y borra el pending. Después redirige al landing con ?payment=success.
//
// IMPORTANTE: si ya tienes un /api/stripe/success existente, MERGE este código
// con el tuyo en lugar de reemplazar. Lo crítico es:
//   1. Leer session.metadata.pending_id (NO password)
//   2. Buscar en pending_registrations
//   3. Crear el user con auth.admin.createUser pasando el password_hash
//      (NOTA: Supabase no acepta password_hash directo, así que el flujo
//      requiere un workaround — ver comentarios abajo)
//   4. Marcar el pending como consumido y borrar el password_hash

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function GET(request) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?payment=error`)
  }

  try {
    // Recuperar la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?payment=cancelled`)
    }

    const pendingId = session.metadata?.pending_id
    if (!pendingId) {
      console.error('Stripe success without pending_id:', sessionId)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?payment=error`)
    }

    // Buscar el pending registration
    const { data: pending, error: pendingErr } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('id', pendingId)
      .maybeSingle()

    if (pendingErr || !pending) {
      console.error('Pending registration not found:', pendingId, pendingErr)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?payment=error`)
    }

    // Si ya fue consumido, no recrear (idempotencia para webhooks duplicados)
    if (pending.consumed_at) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?payment=success`)
    }

    // ────────────────────────────────────────────────────────────────────
    // NOTA IMPORTANTE sobre el password:
    // Supabase auth.admin.createUser() acepta `password` (plaintext) pero NO
    // acepta directamente un bcrypt hash. La forma segura es:
    //  (a) Crear el user CON un password aleatorio fuerte
    //  (b) Marcar email_confirm=true
    //  (c) Mandar al usuario un email con link de "establecer contraseña"
    //      usando supabaseAdmin.auth.admin.generateLink({ type: 'recovery' })
    //
    // De esta forma, el password que el usuario eligió en el RegisterModal
    // efectivamente NO se usa — se le pide que lo configure de nuevo en el
    // primer login. Es la única forma realmente segura sin tocar el flujo
    // de hash de Supabase.
    //
    // Alternativa pragmática (NO recomendada para producción): conservar el
    // password en plaintext durante 30 min en pending_registrations, leerlo
    // aquí, y usarlo para createUser. La superficie de exposición es mucho
    // menor que en Stripe metadata pero sigue siendo plaintext en una DB.
    // ────────────────────────────────────────────────────────────────────

    // Generar un password aleatorio temporal (el usuario establecerá el suyo después)
    const tempPassword = require('crypto').randomBytes(32).toString('hex')

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: pending.email,
      password: tempPassword,
      email_confirm: true,
    })
    if (authError) throw authError

    // Insertar en users table
    await supabaseAdmin.from('users').insert({
      id: authUser.user.id,
      email: pending.email,
      name: pending.nombre,
      role: 'arq',
      plan: pending.plan,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
    })

    // Crear primer proyecto
    const { data: project } = await supabaseAdmin.from('projects').insert({
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

    if (project) {
      await supabaseAdmin.from('project_stages').insert({
        project_id: project.id,
        nombre: 'Proyecto arquitectonico',
        porcentaje: 0,
        fechas: 'Por definir',
        estatus: 'Pendiente',
        orden: 0,
      })
    }

    // Marcar pending como consumido y BORRAR el password_hash inmediatamente
    await supabaseAdmin
      .from('pending_registrations')
      .update({ consumed_at: new Date().toISOString(), password_hash: '' })
      .eq('id', pendingId)

    // Generar link de "establecer contraseña" y mandarlo por email
    if (process.env.RESEND_API_KEY) {
      try {
        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: pending.email,
          options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password` },
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
                  Tu pago se procesó correctamente. Para acceder a tu portal, establece tu contraseña haciendo click abajo.
                  Por seguridad, este link expira en 1 hora.
                </p>
                <a href="${linkData?.properties?.action_link || process.env.NEXT_PUBLIC_APP_URL}" style="display:inline-block;padding:14px 32px;background:#0C0C0C;color:#fff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;">Establecer contraseña</a>
                <p style="font-size:12px;color:#9A9990;margin-top:32px;">Plan activado: <strong>${pending.plan}</strong></p>
              </div>
              <p style="text-align:center;margin-top:24px;font-size:11px;color:#9A9990;">ArchPortal — Portal para despachos de arquitectura</p>
            </div>`,
        })
      } catch (emailErr) {
        console.warn('Setup-password email error:', emailErr.message)
      }
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?payment=success`)

  } catch (error) {
    console.error('Stripe success handler error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?payment=error`)
  }
}
