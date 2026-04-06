'use client'

const SECTIONS = [
  ['I. Identidad y domicilio del Responsable', `Responsable del tratamiento: Luis Castañeda\nDenominación comercial: ArchPortal\nDomicilio: Ensenada, Baja California, México\nCorreo electrónico: privacidad@archportal.mx\nSitio web: archportal.mx`],

  ['II. Datos personales que se recaban', `ArchPortal recaba las siguientes categorías de datos:\n\nA) Datos de identificación: nombre completo, correo electrónico, contraseña (cifrada), nombre del despacho, ciudad y teléfono opcional.\n\nB) Datos de pago: procesados exclusivamente por Stripe, Inc. — ArchPortal NO almacena datos de tarjetas.\n\nC) Datos de clientes finales: ingresados por el arquitecto (nombre, correo y contraseña de acceso al portal). El arquitecto es responsable de contar con el consentimiento de sus clientes.\n\nD) Datos del proyecto: fotografías, planos, documentos, costos, bitácoras y comunicaciones.\n\nE) Datos de navegación: dirección IP, tipo de navegador, páginas visitadas, fecha y hora de acceso.\n\nArchPortal NO recaba datos personales sensibles.`],

  ['III. Finalidades del tratamiento', `Finalidades primarias (necesarias para el servicio):\n• Crear y administrar su cuenta\n• Prestar el servicio de gestión de proyectos\n• Procesar pagos y gestionar suscripción\n• Enviar notificaciones del proyecto\n• Brindar soporte técnico\n• Cumplir obligaciones legales y fiscales\n\nFinalidades secundarias (puede oponerse):\n• Comunicados sobre nuevas funciones\n• Ofertas y promociones\n• Análisis estadísticos de uso\n• Encuestas de satisfacción\n\nPara oponerse a las finalidades secundarias escriba a privacidad@archportal.mx.`],

  ['IV. Transferencia de datos personales', `ArchPortal transfiere datos a:\n\n• Stripe, Inc. — procesador de pagos\n• Supabase, Inc. — base de datos e infraestructura\n• Vercel, Inc. — alojamiento de la Plataforma\n• Anthropic, PBC — modelo de IA del asistente de soporte\n• Autoridades competentes — cuando la ley lo requiera\n\nArchPortal NO transfiere datos con fines comerciales sin su consentimiento.`],

  ['V. Derechos ARCO', `Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales (derechos ARCO).\n\nPara ejercerlos, envíe solicitud a privacidad@archportal.mx indicando:\n• Nombre completo y correo registrado\n• Descripción de los datos y derecho a ejercer\n• Copia de identificación oficial\n\nResponderemos en un plazo máximo de 20 días hábiles conforme a la LFPDPPP.`],

  ['VI. Revocación del consentimiento', `Puede revocar su consentimiento para el tratamiento de sus datos en cualquier momento, salvo cuando sea necesario para una obligación legal o contractual. Escriba a privacidad@archportal.mx. La revocación para finalidades primarias puede implicar la imposibilidad de continuar el servicio.`],

  ['VII. Uso de cookies', `La Plataforma utiliza cookies estrictamente necesarias para mantener la sesión activa y cookies de rendimiento para mejorar la experiencia. Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad.`],

  ['VIII. Medidas de seguridad', `ArchPortal implementa: cifrado de contraseñas, transmisión bajo HTTPS/TLS, almacenamiento en infraestructura certificada (Supabase), acceso restringido a datos, políticas de seguridad de nivel de fila (RLS) en base de datos, y revisiones periódicas de seguridad.`],

  ['IX. Cambios al Aviso', `Los cambios al presente Aviso serán notificados por correo electrónico y mediante aviso en la Plataforma. La versión actualizada estará disponible en archportal.mx/privacidad.`],

  ['X. Derecho a acudir ante el INAI', `Si considera que sus derechos han sido vulnerados puede acudir ante el Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI) en inai.org.mx.`],
]

export default function PrivacyModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 700 }}>

        {/* Header */}
        <div style={{ padding: '36px 48px 24px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 1 }}>
          <button className="modal-close" onClick={onClose}>✕</button>
          <p style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--g400)', marginBottom: 8 }}>ArchPortal</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 30, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>Aviso de Privacidad</h2>
          <p style={{ fontSize: 12, fontWeight: 300, color: 'var(--g400)', marginBottom: 8 }}>Versión 1.0 — Abril 2026 · Conforme a la LFPDPPP</p>
          <div style={{ background: '#FEF4E4', border: '1px solid #F0C060', padding: '8px 14px', fontSize: 11, color: '#7A4A00', lineHeight: 1.6 }}>
            ⚠ Documento provisional. El aviso definitivo validado por un profesional legal estará disponible próximamente.
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '36px 48px', fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 300, color: 'var(--g600)', lineHeight: 1.9, maxHeight: '60vh', overflowY: 'auto' }}>
          <p style={{ marginBottom: 28, fontSize: 13, color: 'var(--g500)', lineHeight: 1.8 }}>
            En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), ArchPortal pone a su disposición el presente Aviso de Privacidad.
          </p>

          {SECTIONS.map(([title, content]) => (
            <div key={title} style={{ marginBottom: 28 }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 20, fontWeight: 400, color: 'var(--ink)', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid var(--g100)' }}>{title}</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{content}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 48px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--g400)', fontWeight: 300 }}>privacidad@archportal.mx</p>
          <button className="btn-submit" style={{ maxWidth: 160, marginTop: 0 }} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
