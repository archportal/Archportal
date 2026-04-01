import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) return NextResponse.json({ exists: false })

  const { data } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  return NextResponse.json({ exists: !!data })
}
