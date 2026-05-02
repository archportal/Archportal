import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/ratelimit'
import bcrypt from 'bcryptjs'

const MASTER_EMAIL = process.env.MASTER_EMAIL || 'master@archportal.net'
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

    // Try Supabase Auth (architect)
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })

    if (!error && data?.user) {
      const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', data.user.id).maybeSingle()
      // Update last_seen
      await supabaseAdmin.from('users').update({ last_seen: new Date().toISOString() }).eq('id', data.user.id)
      return NextResponse.json({
        success: true,
        user: user || { id: data.user.id, email: data.user.email, role: 'arq', name: email.split('@')[0] },
        session: data.session
      })
    }

    // Try client login.
    // Buscamos solo por email — la verificación de password se hace en código,
    // soportando tanto el formato hasheado nuevo (client_pass_hash) como el plaintext
    // legacy (client_pass) para compatibilidad mientras migras los datos.
    const { data: candidates } = await supabaseAdmin
      .from('projects')
      .select('*, users!projects_user_id_fkey(id, name, email)')
      .eq('client_email', email)

    if (candidates && candidates.length > 0) {
      for (const proj of candidates) {
        let valid = false

        // Preferimos el hash nuevo si existe
        if (proj.client_pass_hash) {
          try {
            valid = await bcrypt.compare(password, proj.client_pass_hash)
          } catch { valid = false }
        }
        // Fallback temporal — plaintext legacy.
        // QUITAR esta rama una vez que hayas migrado todos los projects a client_pass_hash.
        else if (proj.client_pass && proj.client_pass === password) {
          valid = true
        }

        if (valid) {
          await supabaseAdmin.from('projects').update({ client_last_seen: new Date().toISOString() }).eq('id', proj.id)
          return NextResponse.json({
            success: true,
            user: {
              id: proj.user_id + '_client_' + proj.id,
              email,
              role: 'cli',
              name: email,
              project_id: proj.id
            },
            session: null,
            client_project: proj
          })
        }
      }
    }

    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })

  } catch (error) {
    // No leakear detalles del error al cliente
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
