import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request) {
  try {
    const { tipo, to, data } = await request.json()

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: true, skipped: 'No RESEND_API_KEY' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    let subject, html

    if (tipo === 'nota_bitacora') {
      subject = `Nueva actualización en tu proyecto ${data.proyecto}`
      html = `
        <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#F5F4F1;padding:48px 24px;">
          <div style="background:#fff;border:1px solid #E2E1DC;padding:48px;">
            <p style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#6B6A62;margin:0 0 24px;">Nueva actualización</p>
            <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#0C0C0C;margin:0 0 8px;">${data.proyecto}</h1>
            <p style="font-size:13px;color:#9A9990;margin:0 0 28px;">${data.arquitecto} publicó una nueva actualización</p>
            <p style="font-size:14px;color:#3D3C36;margin:0 0 20px;">Hola ${data.cliente},</p>
            <div style="background:#F5F4F1;border-left:3px solid #0C0C0C;padding:20px 24px;margin:0 0 32px;">
              <p style="font-size:14px;color:#3D3C36;font-style:italic;margin:0;">${data.nota}</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display:inline-block;padding:14px 32px;background:#0C0C0C;color:#fff;text-decoration:none;font-size:11px;letter-spacing:.1em;text-transform:uppercase;">Ver mi proyecto</a>
          </div>
        </div>
      `
    } else if (tipo === 'pregunta_arq') {
      subject = `Tu cliente tiene una pregunta - ${data.proyecto}`
      html = `
        <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#F5F4F1;padding:48px 24px;">
          <div style="background:#fff;border:1px solid #E2E1DC;padding:48px;">
            <p style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#6B6A62;margin:0 0 24px;">Pregunta sin responder</p>
            <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#0C0C0C;margin:0 0 8px;">${data.proyecto}</h1>
            <p style="font-size:13px;color:#9A9990;margin:0 0 28px;">Tu cliente tiene una pregunta que requiere tu atención</p>
            <p style="font-size:14px;color:#3D3C36;margin:0 0 20px;">El asistente de IA no pudo responder la siguiente pregunta de <strong>${data.cliente}</strong>:</p>
            <div style="background:#F5F4F1;border-left:3px solid #0C0C0C;padding:20px 24px;margin:0 0 32px;">
              <p style="font-size:14px;color:#3D3C36;font-style:italic;margin:0;">${data.pregunta}</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display:inline-block;padding:14px 32px;background:#0C0C0C;color:#fff;text-decoration:none;font-size:11px;letter-spacing:.1em;text-transform:uppercase;">Responder pregunta</a>
          </div>
        </div>
      `
    }

    await resend.emails.send({
      from: 'ArchPortal <noreply@archportal.mx>',
      to,
      subject,
      html
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
