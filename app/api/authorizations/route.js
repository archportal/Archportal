import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET /api/authorizations?project_id=xxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    if (!projectId) {
      return NextResponse.json({ error: 'project_id requerido' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('authorizations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ authorizations: data || [] })
  } catch (e) {
    console.error('GET authorizations error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/authorizations  (arquitecto crea solicitud)
export async function POST(request) {
  try {
    const body = await request.json()
    const { project_id, title, message, photo_url } = body

    if (!project_id || !title?.trim()) {
      return NextResponse.json({ error: 'project_id y título son obligatorios' }, { status: 400 })
    }
    if (title.length > 200) {
      return NextResponse.json({ error: 'Título muy largo (máx. 200 caracteres)' }, { status: 400 })
    }
    if (message && message.length > 2000) {
      return NextResponse.json({ error: 'Mensaje muy largo (máx. 2000 caracteres)' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('authorizations')
      .insert({
        project_id,
        title: title.trim(),
        message: message?.trim() || null,
        photo_url: photo_url || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ authorization: data })
  } catch (e) {
    console.error('POST authorization error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH /api/authorizations  (cliente responde)
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, status, client_observations } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id y status requeridos' }, { status: 400 })
    }
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'status inválido' }, { status: 400 })
    }
    if (client_observations && client_observations.length > 2000) {
      return NextResponse.json({ error: 'Observaciones muy largas' }, { status: 400 })
    }

    // Evitar doble respuesta
    const { data: existing } = await supabaseAdmin
      .from('authorizations')
      .select('status, project_id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Autorización no encontrada' }, { status: 404 })
    }
    if (existing.status !== 'pending') {
      return NextResponse.json({ error: 'Esta solicitud ya fue respondida' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('authorizations')
      .update({
        status,
        client_observations: client_observations?.trim() || null,
        responded_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Obtener email del arquitecto dueño del proyecto
    // NOTA: Asume que `projects` tiene columna `user_id` (FK a auth.users).
    // Si tu columna se llama distinto (ej. architect_id), cambia 'user_id' abajo.
    let architect_email = null
    try {
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('user_id')
        .eq('id', existing.project_id)
        .single()

      if (project?.user_id) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(project.user_id)
        architect_email = userData?.user?.email || null
      }
    } catch (ownerErr) {
      console.warn('No se pudo obtener email del arquitecto:', ownerErr)
    }

    return NextResponse.json({ authorization: data, architect_email })
  } catch (e) {
    console.error('PATCH authorization error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/authorizations?id=xxx  (arquitecto)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('authorizations')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE authorization error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
