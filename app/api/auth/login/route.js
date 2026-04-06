import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/ratelimit'

// Master credentials desde variables de entorno (nunca hardcodeadas)
const MASTER_EMAIL = process.env.MASTER_EMAIL || 'master@archportal.mx'
const MASTER_PASS  = process.env.MASTER_PASS

export async function POST(request) {
  try {
    // Rate limit: 5 intentos por minuto por IP
    const rl = rateLimit(getIP(request), 5, 60_000)
    if (!rl.allowed) return rateLimitResponse(rl.resetAt)

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Correo y contraseña requeridos' }, { status: 400 })
    }

    // Master account check
    if (MASTER_PASS && email === MASTER_EMAIL && password === MASTER_PASS) {
      return NextResponse.json({
        success: true,
        user: { id: 'master', email: MASTER_EMAIL, role: 'master', name: 'ArchPortal Admin' },
        session: null
      })
    }

    // Try Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })

    if (!error && data?.user) {
      const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', data.user.id).maybeSingle()
      return NextResponse.json({
        success: true,
        user: user || { id: data.user.id, email: data.user.email, role: 'arq', name: email.split('@')[0] },
        session: data.session
      })
    }

    // Try client login (email+pass stored in project)
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('*, users!projects_user_id_fkey(id, name, email)')
      .eq('client_email', email)
      .eq('client_pass', password)

    if (projects && projects.length > 0) {
      const proj = projects[0]
      return NextResponse.json({
        success: true,
        user: { id: proj.user_id + '_client_' + proj.id, email, role: 'cli', name: email, project_id: proj.id },
        session: null,
        client_project: proj
      })
    }

    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
