import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// ── Rate limiting simple en memoria ──────────────────────────
// Límites: 10 requests/min por IP en /api/ai
// Nota: en Vercel cada instancia tiene su propio mapa,
// pero es suficiente para frenar abusos básicos.
const ratemap = new Map() // { ip: { count, resetAt } }

function checkRateLimit(ip) {
  const now = Date.now()
  const WINDOW = 60_000  // 1 minuto
  const MAX    = 10      // máximo 10 requests por minuto por IP

  const entry = ratemap.get(ip)

  if (!entry || now > entry.resetAt) {
    ratemap.set(ip, { count: 1, resetAt: now + WINDOW })
    return { allowed: true, remaining: MAX - 1 }
  }

  if (entry.count >= MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: MAX - entry.count }
}

// Limpieza periódica para evitar memory leak
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of ratemap.entries()) {
    if (now > entry.resetAt) ratemap.delete(ip)
  }
}, 5 * 60_000) // cada 5 minutos

// ── Handler ───────────────────────────────────────────────────
export async function POST(request) {
  try {
    // Obtener IP del request
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // Verificar rate limit
    const rl = checkRateLimit(ip)
    if (!rl.allowed) {
      const waitSecs = Math.ceil((rl.resetAt - Date.now()) / 1000)
      return NextResponse.json(
        { error: `Demasiadas solicitudes. Intenta de nuevo en ${waitSecs} segundos.`, iaRespondio: false },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'Retry-After': String(waitSecs),
          }
        }
      )
    }

    const { pregunta, projectId, context, apiKey } = await request.json()

    if (!pregunta?.trim()) {
      return NextResponse.json({ error: 'Pregunta vacía', iaRespondio: false }, { status: 400 })
    }

    const key = apiKey || process.env.ANTHROPIC_API_KEY
    if (!key) {
      return NextResponse.json({ error: 'No hay API Key configurada', iaRespondio: false }, { status: 400 })
    }

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

    // Guardar en Supabase
    await supabaseAdmin.from('project_questions').insert({
      project_id: projectId,
      pregunta,
      respuesta,
      ia_respondio: iaRespondio
    })

    return NextResponse.json(
      { respuesta, iaRespondio },
      { headers: { 'X-RateLimit-Remaining': String(rl.remaining) } }
    )

  } catch (error) {
    console.error('AI error:', error)
    return NextResponse.json({ error: error.message, iaRespondio: false }, { status: 500 })
  }
}
