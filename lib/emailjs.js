// lib/emailjs.js
const SERVICE    = process.env.NEXT_PUBLIC_EMAILJS_SERVICE
const WELCOME    = 'template_w05m1ot'  // usuario y contraseña → {{nombre}}, {{email}}, {{password}}
const MEMBERSHIP = 'template_165dy6b'  // plan y fechas        → {{to_name}}, {{to_email}}, {{email}}, {{plan}}, {{start_date}}, {{renewal_date}}
const NOTIF      = 'template_d2n23nw'  // notificación genérica
const ACCESO     = 'template_w3x3gae'  // acceso cliente
const PUB_KEY    = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC

function initEmailJS() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(false); return }
    if (window.emailjs) { window.emailjs.init({ publicKey: PUB_KEY }); resolve(true); return }
    let tries = 0
    const iv = setInterval(() => {
      tries++
      if (window.emailjs) {
        clearInterval(iv)
        window.emailjs.init({ publicKey: PUB_KEY })
        resolve(true)
      } else if (tries > 25) {
        clearInterval(iv)
        console.warn('EmailJS SDK no cargó')
        resolve(false)
      }
    }, 200)
  })
}

function getRenewalDate(plan) {
  const now = new Date()
  if (plan === 'anual' || plan === 'annual') now.setFullYear(now.getFullYear() + 1)
  else if (plan === 'trimestral' || plan === 'quarterly') now.setMonth(now.getMonth() + 3)
  else now.setMonth(now.getMonth() + 1)
  return now.toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' })
}

function getPlanLabel(plan) {
  const labels = {
    mensual:'Plan Mensual', trimestral:'Plan Trimestral', anual:'Plan Anual',
    monthly:'Monthly Plan', quarterly:'Quarterly Plan',   annual:'Annual Plan',
  }
  return labels[plan] || 'Plan Mensual'
}

// ─────────────────────────────────────────────
// 1. BIENVENIDA — usuario y contraseña
//    Template: template_w05m1ot
// ─────────────────────────────────────────────
export async function sendWelcomeEmail(nombre, email, password) {
  const ready = await initEmailJS()
  if (!ready) return
  try {
    const res = await window.emailjs.send(SERVICE, WELCOME, { nombre, email, password })
    console.log('✅ Welcome email enviado a:', email, res.status)
  } catch (e) {
    console.warn('❌ Welcome email error:', e.text || e)
  }
}

// ─────────────────────────────────────────────
// 2. MEMBRESÍA — plan, fecha inicio y renovación
//    Template: template_165dy6b
// ─────────────────────────────────────────────
export async function sendMembershipEmail(nombre, email, plan = 'mensual') {
  const ready = await initEmailJS()
  if (!ready) return
  const today = new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' })
  try {
    const res = await window.emailjs.send(SERVICE, MEMBERSHIP, {
      to_name:      nombre,
      to_email:     email,
      email:        email,
      plan:         getPlanLabel(plan),
      start_date:   today,
      renewal_date: getRenewalDate(plan),
    })
    console.log('✅ Membership email enviado a:', email, res.status)
  } catch (e) {
    console.warn('❌ Membership email error:', e.text || e)
  }
}

// ─────────────────────────────────────────────
// Función base notificaciones
// ─────────────────────────────────────────────
async function sendNotification({ destinatario, nombreRemitente, emailRemitente, proyecto, cliente, asunto, nota }) {
  const ready = await initEmailJS()
  if (!ready) return
  try {
    await window.emailjs.send(SERVICE, NOTIF, {
      email_cliente: destinatario,
      name:          nombreRemitente,
      email:         emailRemitente,
      proyecto, cliente, asunto, nota
    })
    console.log('✅ Notificación enviada a:', destinatario)
  } catch (e) {
    console.warn('❌ Notificación email error:', e.text || e)
  }
}

// ─────────────────────────────────────────────
// 3. BITÁCORA → notifica al cliente
// ─────────────────────────────────────────────
export async function sendBitacoraEmail({ clientEmail, arquitectoNombre, arquitectoEmail, proyecto, cliente, nota }) {
  if (!clientEmail) { console.warn('sendBitacoraEmail: no hay email del cliente'); return }
  await sendNotification({
    destinatario: clientEmail, nombreRemitente: arquitectoNombre || 'Tu arquitecto',
    emailRemitente: arquitectoEmail || '', proyecto, cliente,
    asunto: `Nueva actualización en tu proyecto — ${proyecto}`, nota
  })
}

// ─────────────────────────────────────────────
// 4. NOTA DEL ARQUITECTO → notifica al cliente
// ─────────────────────────────────────────────
export async function sendNotaArqEmail({ clientEmail, arquitectoNombre, arquitectoEmail, proyecto, cliente, nota }) {
  if (!clientEmail) { console.warn('sendNotaArqEmail: no hay email del cliente'); return }
  await sendNotification({
    destinatario: clientEmail, nombreRemitente: arquitectoNombre || 'Tu arquitecto',
    emailRemitente: arquitectoEmail || '', proyecto, cliente,
    asunto: `Mensaje directo de tu arquitecto — ${proyecto}`, nota
  })
}

// ─────────────────────────────────────────────
// 5. ACCESO CLIENTE
// ─────────────────────────────────────────────
export async function sendClientAccessEmail({ nombreCliente, emailCliente, passwordCliente, proyecto, nombreArquitecto, emailArquitecto }) {
  if (!emailCliente) { console.warn('sendClientAccessEmail: no hay email del cliente'); return }
  const ready = await initEmailJS()
  if (!ready) return
  try {
    await window.emailjs.send(SERVICE, ACCESO, {
      nombre_cliente: nombreCliente || 'Cliente', email_cliente: emailCliente,
      password_cliente: passwordCliente || '', proyecto: proyecto || '',
      nombre_arquitecto: nombreArquitecto || 'Tu arquitecto', email_arquitecto: emailArquitecto || ''
    })
    console.log('✅ Acceso cliente enviado a:', emailCliente)
  } catch (e) {
    console.warn('❌ Acceso cliente email error:', e.text || e)
  }
}

// ─────────────────────────────────────────────
// 6. NOTIFICACIÓN AL ARQUITECTO (IA sin respuesta)
// ─────────────────────────────────────────────
export async function sendNotifEmail({ arquitectoEmail, arquitectoNombre, clienteNombre, clienteEmail, proyecto, pregunta }) {
  if (!arquitectoEmail) { console.warn('sendNotifEmail: no hay email del arquitecto'); return }
  const ready = await initEmailJS()
  if (!ready) return
  try {
    await window.emailjs.send(SERVICE, NOTIF, {
      email_cliente: arquitectoEmail, name: clienteNombre || 'Tu cliente',
      email: clienteEmail || '', proyecto, cliente: clienteNombre || 'Tu cliente',
      asunto: `Nueva pregunta sin respuesta — ${proyecto}`, nota: pregunta
    })
    console.log('✅ Notif arquitecto enviada:', arquitectoEmail)
  } catch (e) {
    console.warn('❌ sendNotifEmail error:', e.text || e)
  }
}

// ─────────────────────────────────────────────
// 7. AUTORIZACIÓN REQUESTED → notifica al cliente
// ─────────────────────────────────────────────
export async function sendAuthRequestEmail({ clientEmail, arquitectoNombre, arquitectoEmail, proyecto, cliente, titulo, mensaje }) {
  if (!clientEmail) { console.warn('sendAuthRequestEmail: no hay email del cliente'); return }
  const cuerpo = mensaje
    ? `${mensaje}\n\n— Entra al portal para autorizar o dejar tus observaciones.`
    : `Tu arquitecto ha solicitado tu autorización para: ${titulo}.\n\nEntra al portal para autorizar o dejar tus observaciones.`
  await sendNotification({
    destinatario: clientEmail,
    nombreRemitente: arquitectoNombre || 'Tu arquitecto',
    emailRemitente: arquitectoEmail || '',
    proyecto, cliente,
    asunto: `Autorización pendiente: ${titulo} — ${proyecto}`,
    nota: cuerpo
  })
}

// ─────────────────────────────────────────────
// 8. AUTORIZACIÓN RESPONDED → notifica al arquitecto
// ─────────────────────────────────────────────
export async function sendAuthResponseEmail({ arquitectoEmail, clienteNombre, clienteEmail, proyecto, titulo, decision, observaciones }) {
  if (!arquitectoEmail) { console.warn('sendAuthResponseEmail: no hay email del arquitecto'); return }
  const verb  = decision === 'approved' ? 'AUTORIZÓ' : 'NO autorizó'
  const label = decision === 'approved' ? 'Autorizado' : 'No autorizado'
  const cuerpo = observaciones
    ? `${clienteNombre || 'Tu cliente'} ${verb} la solicitud "${titulo}".\n\nObservaciones del cliente:\n${observaciones}`
    : `${clienteNombre || 'Tu cliente'} ${verb} la solicitud "${titulo}".\n\n(Sin observaciones adicionales)`
  await sendNotification({
    destinatario: arquitectoEmail,
    nombreRemitente: clienteNombre || 'Cliente',
    emailRemitente: clienteEmail || '',
    proyecto, cliente: clienteNombre || 'Cliente',
    asunto: `${label}: ${titulo} — ${proyecto}`,
    nota: cuerpo
  })
}
