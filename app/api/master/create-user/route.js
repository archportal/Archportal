import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email, password, nombre } = await request.json()

    if (!email || !password || !nombre) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Check duplicate
    const { data: existing } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 400 })
    }

    // Create Supabase Auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true
    })
    if (authError) throw authError

    // Save to users table with plan anual
    const { data: user, error: userError } = await supabaseAdmin.from('users').insert({
      id: authUser.user.id, email, name: nombre, role: 'arq', plan: 'anual'
    }).select().single()
    if (userError) throw userError

    // Create initial project
    const { data: project } = await supabaseAdmin.from('projects').insert({
      user_id: user.id,
      nombre: nombre + ' - Proyecto 1',
      cliente: '', ubicacion: '',
      arquitecto: nombre, presupuesto: 0, pres_ejercido: 0, pres_pagado: 0,
      etapa_actual: 'Por iniciar', architect_email: email
    }).select().single()

    if (project) {
      await supabaseAdmin.from('project_stages').insert({
        project_id: project.id, nombre: 'Proyecto arquitectonico',
        porcentaje: 0, fechas: 'Por definir', estatus: 'Pendiente', orden: 0
      })
    }

    return NextResponse.json({ success: true, user })

  } catch (error) {
    console.error('Master create user error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
