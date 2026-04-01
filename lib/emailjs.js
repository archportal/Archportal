// lib/emailjs.js
// Todas las funciones de correo de ArchPortal usando EmailJS

const SERVICE  = 'service_y8oqc0d'
const WELCOME  = 'template_w05m1ot'  // Bienvenido a ArchPortal → vars: {{nombre}}, {{email}}, {{password}}
const NOTIF    = 'template_d2n23nw'  // Notificación genérica  → vars: {{email_cliente}}, {{name}}, {{email}}, {{proyecto}}, {{cliente}}, {{asunto}}, {{nota}}
const ACCESO   = 'template_w3x3gae'  // Acceso cliente         → vars: {{nombre_cliente}}, {{email_cliente}}, {{password_cliente}}, {{proyecto}}, {{nombre_arquitecto}}, {{email_arquitecto}}
const PUB_KEY  = '7rTOKqMzkk2FuOzSV'

// Espera a que el SDK de EmailJS cargue (viene del CDN en layout.js)
function initEmailJS() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(false); return }
    if (window.emailjs) { window.emailjs.init(PUB_KEY); resolve(true); return }
    let tries = 0
    const iv = setInterval(() => {
      tries++
      if (window.emailjs) {
        clearInterval(iv)
        window.emailjs.init(PUB_KEY)
        resolve(true)
      } else if (tries > 25) {
        clearInterval(iv)
        console.warn('EmailJS SDK no cargó')
        resolve(false)
      }
    }, 200)
  })
}

// ─────────────────────────────────────────────
// 1. BIENVENIDA AL ARQUITECTO al registrarse
//    Template: template_w05m1ot
//    Vars:     {{nombre}}, {{email}}
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
// Función base para notificaciones con template_d2n23nw
// IMPORTANTE: el template debe tener {{asunto}} y {{mensaje}}
// ─────────────────────────────────────────────
async function sendNotification({ destinatario, nombreRemitente, emailRemitente, proyecto, cliente, asunto, nota }) {
  const ready = await initEmailJS()
  if (!ready) return
  try {
    const res = await window.emailjs.send(SERVICE, NOTIF, {
      email_cliente: destinatario,      // To Email  → email del destinatario
      name:          nombreRemitente,   // From Name → nombre de quien envía
      email:         emailRemitente,    // Reply To  → email de quien envía
      proyecto,
      cliente,
      asunto,
      nota                              // Contenido principal del mensaje
    })
    console.log('✅ Notificación enviada a:', destinatario, res.status)
  } catch (e) {
    console.warn('❌ Notificación email error:', e.text || e)
  }
}

// ─────────────────────────────────────────────
// 2. BITÁCORA → notifica al cliente cuando el
//    arquitecto publica una nota semanal
// ─────────────────────────────────────────────
export async function sendBitacoraEmail({ clientEmail, arquitectoNombre, arquitectoEmail, proyecto, cliente, nota }) {
  if (!clientEmail) { console.warn('sendBitacoraEmail: no hay email del cliente'); return }
  await sendNotification({
    destinatario:    clientEmail,
    nombreRemitente: arquitectoNombre || 'Tu arquitecto',
    emailRemitente:  arquitectoEmail  || '',
    proyecto,
    cliente,
    asunto: `Nueva actualización en tu proyecto — ${proyecto}`,
    nota
  })
}

// ─────────────────────────────────────────────
// 3. NOTA DEL ARQUITECTO → notifica al cliente
//    cuando el arquitecto le envía un mensaje directo
// ─────────────────────────────────────────────
export async function sendNotaArqEmail({ clientEmail, arquitectoNombre, arquitectoEmail, proyecto, cliente, nota }) {
  if (!clientEmail) { console.warn('sendNotaArqEmail: no hay email del cliente'); return }
  await sendNotification({
    destinatario:    clientEmail,
    nombreRemitente: arquitectoNombre || 'Tu arquitecto',
    emailRemitente:  arquitectoEmail  || '',
    proyecto,
    cliente,
    asunto: `Mensaje directo de tu arquitecto — ${proyecto}`,
    nota
  })
}

// ─────────────────────────────────────────────
// 4. ACCESO CLIENTE → cuando el arquitecto
//    asigna credenciales al cliente en el Admin
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
// 5. NOTIFICACIÓN AL ARQUITECTO → cuando la IA
//    no puede responder una pregunta del cliente
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
