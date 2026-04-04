// lib/emailjs.js
// Todas las funciones de correo de ArchPortal usando EmailJS

const SERVICE  = 'service_y8oqc0d'
const WELCOME  = 'template_165dy6b'  // Bienvenida arquitecto → vars: {{to_name}}, {{to_email}}, {{email}}, {{plan}}, {{start_date}}, {{renewal_date}}
const NOTIF    = 'template_d2n23nw'  // Notificación genérica  → vars: {{email_cliente}}, {{name}}, {{email}}, {{proyecto}}, {{cliente}}, {{asunto}}, {{nota}}
const ACCESO   = 'template_w3x3gae'  // Acceso cliente         → vars: {{nombre_cliente}}, {{email_cliente}}, {{password_cliente}}, {{proyecto}}, {{nombre_arquitecto}}, {{email_arquitecto}}
const PUB_KEY  = '7rTOKqMzkk2FuOzSV'

// Espera a que el SDK de EmailJS cargue (viene del CDN en layout.js)
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

// Calcula fecha de renovación según plan
function getRenewalDate(plan) {
  const now = new Date()
  const fmt = (d) => d.toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' })
  if (plan === 'anual' || plan === 'annual') {
    now.setFullYear(now.getFullYear() + 1)
  } else if (plan === 'trimestral' || plan === 'quarterly') {
    now.setMonth(now.getMonth() + 3)
  } else {
    now.setMonth(now.getMonth() + 1)
  }
  return fmt(now)
}

function getPlanLabel(plan) {
  const labels = {
    mensual: 'Plan Mensual', trimestral: 'Plan Trimestral', anual: 'Plan Anual',
    monthly: 'Monthly Plan', quarterly: 'Quarterly Plan', annual: 'Annual Plan',
  }
  return labels[plan] || 'Plan Mensual'
}

// ─────────────────────────────────────────────
// 1. BIENVENIDA AL ARQUITECTO al registrarse
//    Template: template_165dy6b
// ─────────────────────────────────────────────
export async function sendWelcomeEmail(nombre, email, password, plan = 'mensual') {
  const ready = await initEmailJS()
  if (!ready) return
  const today = new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' })
  try {
    const res = await window.emailjs.send(SERVICE, WELCOME, {
      to_name:      nombre,
      to_email:     email,
      email:        email,
      plan:         getPlanLabel(plan),
      start_date:   today,
      renewal_date: getRenewalDate(plan),
    })
    console.log('✅ Welcome email enviado a:', email, res.status)
  } catch (e) {
    console.warn('❌ Welcome email error:', e.text || e)
  }
}

// ─────────────────────────────────────────────
// Función base para notificaciones con template_d2n23nw
// ─────────────────────────────────────────────
async function sendNotification({ destinatario, nombreRemitente, emailRemitente, proyecto, cliente, asunto, nota }) {
  const ready = await initEmailJS()
  if (!ready) return
  try {
    const res = await window.emailjs.send(SERVICE, NOTIF, {
      email_cliente: destinatario,
      name:          nombreRemitente,
      email:         emailRemitente,
      proyecto,
      cliente,
      asunto,
      nota
    })
    console.log('✅ Notificación enviada a:', destinatario, res.status)
  } catch (e) {
    console.warn('❌ Notificación email error:', e.text || e)
  }
}

// ─────────────────────────────────────────────
// 2. BITÁCORA → notifica al cliente
// ─────────────────────────────────────────────
export async function sendBitacoraEmail({ clientEmail, arquitectoNombre, arquitectoEmail, proyecto, cliente, nota }) {
  if (!clientEmail) { console.warn('sendBitacoraEmail: no hay email del cliente'); return }
  await sendNotification({
    destinatario:    clientEmail,
    nombreRemitente: arquitectoNombre || 'Tu arquitecto',
    emailRemitente:  arquitectoEmail  || '',
    proyecto, cliente,
    asunto: `Nueva actualización en tu proyecto — ${proyecto}`,
    nota
  })
}

// ─────────────────────────────────────────────
// 3. NOTA DEL ARQUITECTO → notifica al cliente
// ─────────────────────────────────────────────
export async function sendNotaArqEmail({ clientEmail, arquitectoNombre, arquitectoEmail, proyecto, cliente, nota }) {
  if (!clientEmail) { console.warn('sendNotaArqEmail: no hay email del cliente'); return }
  await sendNotification({
    destinatario:    clientEmail,
    nombreRemitente: arquitectoNombre || 'Tu arquitecto',
    emailRemitente:  arquitectoEmail  || '',
    proyecto, cliente,
    asunto: `Mensaje directo de tu arquitecto — ${proyecto}`,
    nota
  })
}

// ─────────────────────────────────────────────
// 4. ACCESO CLIENTE
// ─────────────────────────────────────────────
export async function sendClientAccessEmail({ nombreCliente, emailCliente, passwordCliente, proyecto, nombreArquitecto, emailArquitecto }) {
  if (!emailCliente) { console.warn('sendClientAccessEmail: no hay email del cliente'); return }
  const ready = await initEmailJS()
  if (!ready) return
  try {
    const res = await window.emailjs.send(SERVICE, ACCESO, {
      nombre_cliente:    nombreCliente    || 'Cliente',
      email_cliente:     emailCliente,
      password_cliente:  passwordCliente  || '',
      proyecto:          proyecto         || '',
      nombre_arquitecto: nombreArquitecto || 'Tu arquitecto',
      email_arquitecto:  emailArquitecto  || ''
    })
    console.log('✅ Acceso cliente enviado a:', emailCliente, res.status)
  } catch (e) {
    console.warn('❌ Acceso cliente email error:', e.text || e)
  }
}

// ─────────────────────────────────────────────
// 5. NOTIFICACIÓN AL ARQUITECTO (IA sin respuesta)
// ─────────────────────────────────────────────
export async function sendNotifEmail({ arquitectoEmail, arquitectoNombre, clienteNombre, clienteEmail, proyecto, pregunta }) {
  if (!arquitectoEmail) { console.warn('sendNotifEmail: no hay email del arquitecto'); return }
  const ready = await initEmailJS()
  if (!ready) return
  try {
    const res = await window.emailjs.send(SERVICE, NOTIF, {
      email_cliente: arquitectoEmail,
      name:          clienteNombre || 'Tu cliente',
      email:         clienteEmail  || '',
      proyecto,
      cliente:       clienteNombre || 'Tu cliente',
      asunto:        `Nueva pregunta sin respuesta — ${proyecto}`,
      nota:          pregunta
    })
    console.log('✅ Notif arquitecto enviada:', arquitectoEmail, res.status)
  } catch (e) {
    console.warn('❌ sendNotifEmail error:', e.text || e)
  }
}
