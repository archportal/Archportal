import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { userId, name, password } = await request.json()

    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })

    // Actualizar nombre en tabla users
    if (name) {
      const { error } = await supabaseAdmin.from('users').update({ name }).eq('id', userId)
      if (error) throw error
    }

    // Cambiar contraseña en Supabase Auth
    if (password) {
      if (password.length < 8) return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update account error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
