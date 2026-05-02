import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/ratelimit'

export async function POST(request) {
  let createdAuthUserId = null

  try {
    // Rate limit: 3 registros por minuto por IP
    const rl = rateLimit(getIP(request), 3, 60_000)
    if (!rl.allowed) return rateLimitResponse(rl.resetAt)

    const { nombre, email, password, despacho, ciudad, plan } = await request.json()

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 })
    }

    if (password.length < 10) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 10 caracteres' }, { status: 400 })
    }

    // Check duplicate en users table
    const { data: existing } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo. Ingresa directamente al portal.' }, { status: 400 })
    }

    // Check duplicate también en Supabase Auth (puede haber un user huérfano de un registro fallido previo)
    try {
      const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      if (authList?.users?.some(u => u.email === email)) {
        return NextResponse.json({ error: 'Ya existe una cuenta con ese correo. Ingresa directamente al portal.' }, { status: 400 })
      }
    } catch {
      // Si listUsers falla, continuamos — el siguiente paso fallaría de todos modos si es duplicado
    }

    // Create Supabase Auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true
    })
    if (authError) throw authError
    createdAuthUserId = authUser.user.id

    // Save to users table — si falla, hacemos rollback del auth user
    const { data: user, error: userError } = await supabaseAdmin.from('users').insert({
      id: authUser.user.id, email, name: nombre, role: 'arq', plan: plan || 'mensual'
    }).select().single()
    if (userError) throw userError

    // Create initial project
    const { data: project } = await supabaseAdmin.from('projects').insert({
      user_id: user.id,
      nombre: (despacho || nombre) + ' - Proyecto 1',
      cliente: '', ubicacion: ciudad || '',
      arquitecto: nombre, presupuesto: 0, pres_ejercido: 0, pres_pagado: 0,
      etapa_actual: 'Por iniciar', architect_email: email
    }).select().single()

    if (project) {
      await supabaseAdmin.from('project_stages').insert({
        project_id: project.id, nombre: 'Proyecto arquitectonico',
        porcentaje: 0, fechas: 'Por definir', estatus: 'Pendiente', orden: 0
      })
    }

    // Try send welcome email via Resend if available (server-side, sin password)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'ArchPortal <noreply@archportal.net>',
          to: email,
          subject: 'Bienvenido a ArchPortal',
          html: `
            <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#F5F4F1;padding:48px 24px;">
              <div style="background:#fff;border:1px solid #E2E1DC;padding:48px;">
                <p style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#6B6A62;margin:0 0 24px;">Cuenta activada</p>
                <h1 style="font-family:Georgia,serif;font-size:32px;font-weight:400;color:#0C0C0C;margin:0 0 24px;">Bienvenido a ArchPortal, ${nombre}</h1>
                <p style="font-size:14px;color:#3D3C36;line-height:1.8;margin:0 0 24px;">Tu cuenta ha sido creada exitosamente. Ingresa al portal con el correo y la contraseña que elegiste durante el registro.</p>
                <div style="background:#F5F4F1;padding:24px;margin:0 0 32px;">
                  <p style="font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#9A9990;margin:0 0 12px;">Tu cuenta</p>
                  <p style="margin:0;font-size:14px;color:#0C0C0C;"><strong>Usuario:</strong> ${email}</p>
                  <p style="margin:8px 0 0;font-size:14px;color:#0C0C0C;"><strong>Plan:</strong> ${plan || 'Mensual'}</p>
                </div>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://archportal.net'}" style="display:inline-block;padding:14px 32px;background:#0C0C0C;color:#fff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;">Entrar al portal</a>
              </div>
              <p style="text-align:center;margin-top:24px;font-size:11px;color:#9A9990;">ArchPortal — Portal para despachos de arquitectura</p>
            </div>`
        })
      } catch (emailErr) {
        console.warn('Welcome email error:', emailErr.message)
      }
    }

    // No regresamos credentials con password en plaintext
    return NextResponse.json({ success: true, user })

  } catch (error) {
    // Rollback: si creamos el auth user pero falló algo después, lo borramos
    if (createdAuthUserId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId)
        console.warn('Rolled back auth user:', createdAuthUserId)
      } catch (rbErr) {
        console.error('Rollback failed for', createdAuthUserId, rbErr)
      }
    }

    console.error('Register error:', error)
    return NextResponse.json({ error: 'No se pudo crear la cuenta. Intenta de nuevo.' }, { status: 500 })
  }
}
