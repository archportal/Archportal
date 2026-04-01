import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request) {
  try {
    const { pregunta, projectId, context, apiKey } = await request.json()

    const key = apiKey || process.env.ANTHROPIC_API_KEY
    if (!key) return NextResponse.json({ error: 'No hay API Key configurada', iaRespondio: false }, { status: 400 })

    const client = new Anthropic({ apiKey: key })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: `${context || 'Eres el asistente de un proyecto de construcción.'}\n\nIMPORTANTE: Si no tienes información suficiente para responder la pregunta con datos concretos del proyecto, responde EXACTAMENTE con: "NO_TENGO_DATO". No intentes adivinar ni dar información genérica.`,
      messages: [{ role: 'user', content: pregunta }]
    })

    const rawRespuesta = message.content[0].text
    const iaRespondio = !rawRespuesta.includes('NO_TENGO_DATO')
    const respuesta = iaRespondio
      ? rawRespuesta
      : 'No cuento con esa información en este momento. Tu arquitecto ha sido notificado y te responderá a la brevedad.'

    // Guardar pregunta y respuesta en Supabase
    await supabaseAdmin.from('project_questions').insert({
      project_id: projectId,
      pregunta,
      respuesta,
      ia_respondio: iaRespondio
    })

    return NextResponse.json({ respuesta, iaRespondio })

  } catch (error) {
    console.error('AI error:', error)
    return NextResponse.json({ error: error.message, iaRespondio: false }, { status: 500 })
  }
}
