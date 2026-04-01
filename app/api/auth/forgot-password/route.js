import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email } = await request.json()

    // Find architect user
    const { data: user } = await supabaseAdmin.from('users').select('*').eq('email', email).eq('role', 'arq').maybeSingle()

    if (!user) {
      return NextResponse.json({ success: true, found: false })
    }

    // Try send via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'ArchPortal <noreply@archportal.mx>',
          to: email,
          subject: 'ArchPortal — Recuperación de contraseña',
          html: `
            <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#F5F4F1;padding:48px 24px;">
              <div style="background:#fff;border:1px solid #E2E1DC;padding:48px;">
                <p style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#6B6A62;margin:0 0 24px;">Recuperación de acceso</p>
                <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#0C0C0C;margin:0 0 24px;">Hola, ${user.name}</h1>
                <p style="font-size:14px;color:#3D3C36;line-height:1.8;margin:0 0 24px;">Recibimos una solicitud para recuperar tu acceso a ArchPortal.</p>
                <div style="background:#F5F4F1;padding:24px;margin:0 0 32px;">
                  <p style="font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#9A9990;margin:0 0 12px;">Tus datos de acceso</p>
                  <p style="margin:0;font-size:14px;color:#0C0C0C;"><strong>Email:</strong> ${email}</p>
                  <p style="margin:8px 0 0;font-size:13px;color:#6B6A62;">Si olvidaste tu contraseña, puedes restablecerla desde el portal.</p>
                </div>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display:inline-block;padding:14px 32px;background:#0C0C0C;color:#fff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;">Entrar al portal</a>
              </div>
            </div>`
        })
      } catch (e) { console.warn('Forgot email error:', e.message) }
    }

    return NextResponse.json({ success: true, found: true, name: user.name })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
