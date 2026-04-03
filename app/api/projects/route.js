import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

async function sendEmail(to, subject, html) {
  if (!resend || !to) return
  try {
    await resend.emails.send({ from: 'ArchPortal <noreply@archportal.mx>', to, subject, html })
  } catch (e) { console.warn('Email error:', e.message) }
}

const emailHtml = (titulo, proyecto, mensaje, cta = null) => `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#F5F4F1;padding:48px 24px;">
  <div style="background:#fff;border:1px solid #E2E1DC;padding:48px;">
    <p style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#6B6A62;margin:0 0 24px;">${titulo}</p>
    <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#0C0C0C;margin:0 0 8px;">${proyecto}</h1>
    <div style="height:1px;background:#E2E1DC;margin:24px 0;"></div>
    <div style="background:#F5F4F1;border-left:3px solid #0C0C0C;padding:20px 24px;margin-bottom:32px;">
      <p style="font-size:14px;color:#3D3C36;font-weight:300;line-height:1.8;margin:0;">${mensaje}</p>
    </div>
    ${cta ? `<a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display:inline-block;padding:14px 32px;background:#0C0C0C;color:#fff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;">${cta}</a>` : ''}
  </div>
  <p style="text-align:center;margin-top:24px;font-size:11px;color:#9A9990;font-family:Helvetica,sans-serif;">ArchPortal — Portal para despachos de arquitectura</p>
</div>`

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const projectId = searchParams.get('id')

    if (projectId) {
      const { data: project, error } = await supabaseAdmin.from('projects').select('*').eq('id', projectId).single()
      if (error) throw error
      const [stages, costs, posts, photos, files, questions] = await Promise.all([
        supabaseAdmin.from('project_stages').select('*').eq('project_id', projectId).order('orden'),
        supabaseAdmin.from('project_costs').select('*').eq('project_id', projectId),
        supabaseAdmin.from('project_posts').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabaseAdmin.from('project_photos').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabaseAdmin.from('project_files').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabaseAdmin.from('project_questions').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      ])
      return NextResponse.json({ project, stages: stages.data||[], costs: costs.data||[], posts: posts.data||[], photos: photos.data||[], files: files.data||[], questions: questions.data||[] })
    }

    if (userId) {
      const { data: projects, error } = await supabaseAdmin.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (error) throw error
      return NextResponse.json({ projects })
    }

    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { stages, costs, photos, files, posts, questions, ...projectData } = body

    // Check project limit based on plan
    const PLAN_LIMITS = { mensual: 3, trimestral: 10, anual: 20, monthly: 3, quarterly: 10, annual: 20 }
    if (projectData.user_id) {
      const { data: user } = await supabaseAdmin.from('users').select('plan').eq('id', projectData.user_id).maybeSingle()
      const plan = user?.plan || 'mensual'
      const limit = PLAN_LIMITS[plan] || 3
      const { count } = await supabaseAdmin.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', projectData.user_id)
      if (count >= limit) {
        return NextResponse.json({ error: `Tu plan ${plan} permite un máximo de ${limit} proyecto(s). Actualiza tu plan para agregar más.` }, { status: 403 })
      }
    }

    const { data: project, error } = await supabaseAdmin.from('projects').insert(projectData).select().single()
    if (error) throw error
    await supabaseAdmin.from('project_stages').insert({ project_id: project.id, nombre: 'Proyecto arquitectonico', porcentaje: 0, fechas: 'Por definir', estatus: 'Pendiente', orden: 0 })
    return NextResponse.json({ project })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, stages, costs, posts, photos, files, questions, new_post, notes, knowledge_base, send_nota_email, send_post_email, ...updates } = body

    // Update main project fields - only known safe columns
    if (Object.keys(updates).length > 0) {
      // Filter to only columns that exist in projects table
      const safeColumns = ['nombre','cliente','ubicacion','arquitecto','etapa_actual','entrega',
        'presupuesto','pres_ejercido','pres_pagado','client_email','client_pass','architect_email',
        'notes','knowledge_base','inicio']
      const safeUpdates = {}
      for (const [k,v] of Object.entries(updates)) {
        if (safeColumns.includes(k)) safeUpdates[k] = v
      }
      // Try to save superficie, niveles separately (may not exist)
      if (updates.superficie || updates.niveles) {
        try {
          await supabaseAdmin.from('projects').update({
            ...(updates.superficie ? {superficie: updates.superficie} : {}),
            ...(updates.niveles ? {niveles: updates.niveles} : {})
          }).eq('id', id)
        } catch(e) { /* columns may not exist */ }
      }
      if (Object.keys(safeUpdates).length > 0) {
        const { error } = await supabaseAdmin.from('projects').update(safeUpdates).eq('id', id)
        if (error) throw error
      }
    }

    // Stages
    if (stages !== undefined) {
      await supabaseAdmin.from('project_stages').delete().eq('project_id', id)
      if (stages.length > 0) {
        const { error } = await supabaseAdmin.from('project_stages').insert(
          stages.map((s, i) => ({ project_id: id, nombre: s.nombre, porcentaje: parseInt(s.porcentaje)||0, fechas: s.fechas||'Por definir', estatus: s.estatus||'Pendiente', orden: i }))
        )
        if (error) throw error
      }
    }

    // Costs
    if (costs !== undefined) {
      await supabaseAdmin.from('project_costs').delete().eq('project_id', id)
      if (costs.length > 0) {
        await supabaseAdmin.from('project_costs').insert(
          costs.map(c => ({ project_id: id, concepto: c.concepto, categoria: c.categoria, etapa: c.etapa||'', monto: parseInt(c.monto)||0, estatus: c.estatus, fecha: c.fecha||'' }))
        )
      }
    }

    // New post (bitácora)
    if (new_post) {
      await supabaseAdmin.from('project_posts').insert({ project_id: id, texto: new_post.texto, autor: new_post.autor, fecha: new_post.fecha })
      // Send email to client
      if (send_post_email && new_post.client_email) {
        await sendEmail(new_post.client_email, `Nueva actualización en tu proyecto — ${new_post.proyecto}`,
          emailHtml('Nueva actualización en la bitácora', new_post.proyecto, `Tu arquitecto publicó: <em>"${new_post.texto}"</em>`, 'Ver mi proyecto'))
      }
    }

    // Photos
    if (photos !== undefined) {
      await supabaseAdmin.from('project_photos').delete().eq('project_id', id)
      if (photos.length > 0) {
        await supabaseAdmin.from('project_photos').insert(
          photos.map(f => ({ project_id: id, nombre: f.nombre, url: f.url||f.remoteUrl||'', fecha: f.fecha||'' }))
        )
      }
    }

    // Files
    if (files !== undefined) {
      await supabaseAdmin.from('project_files').delete().eq('project_id', id)
      if (files.length > 0) {
        await supabaseAdmin.from('project_files').insert(
          files.map(f => ({ project_id: id, nombre: f.nombre, tipo: f.tipo||'', etapa: f.etapa||'', fecha: f.fecha||'', url: f.url||'' }))
        )
      }
    }

    // Questions
    if (questions !== undefined) {
      await supabaseAdmin.from('project_questions').delete().eq('project_id', id)
      if (questions.length > 0) {
        await supabaseAdmin.from('project_questions').insert(
          questions.map(q => ({ project_id: id, pregunta: q.pregunta, respuesta: q.respuesta||null, ia_respondio: q.ia_respondio||false }))
        )
      }
    }

    // knowledge_base & notes as JSONB
    if (knowledge_base !== undefined) {
      await supabaseAdmin.from('projects').update({ knowledge_base }).eq('id', id)
    }
    if (notes !== undefined) {
      await supabaseAdmin.from('projects').update({ notes }).eq('id', id)
      // Send email to client for direct notes
      if (send_nota_email && notes.length > 0) {
        const { data: proj } = await supabaseAdmin.from('projects').select('nombre, client_email').eq('id', id).single()
        if (proj?.client_email) {
          await sendEmail(proj.client_email, `Tu arquitecto te envió un mensaje — ${proj.nombre}`,
            emailHtml('Mensaje directo de tu arquitecto', proj.nombre, notes[0].texto, 'Ver mi proyecto'))
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await supabaseAdmin.from('projects').delete().eq('id', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
