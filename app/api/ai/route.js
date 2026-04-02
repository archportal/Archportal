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
      system: `${context || 'Eres el asistente de un proyecto de construcción.'}\n\nINSTRUCCIONES:\n1. Usa TODA la información del proyecto y la base de conocimiento para responder.\n2. Si la respuesta está en la información proporcionada, respóndela directamente y con claridad.\n3. SOLO si definitivamente no tienes el dato en la información proporcionada, responde EXACTAMENTE: "NO_TENGO_DATO"\n4. No respondas NO_TENGO_DATO si el dato sí está en la base de conocimiento o en los datos del proyecto.`,
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
