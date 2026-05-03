'use client'

const SECTIONS = [
  ['1. Introducción y aceptación', `Bienvenido a ArchPortal, una plataforma de gestión de proyectos para despachos de arquitectura y construcción (en adelante, "la Plataforma" o "ArchPortal"), operada por Luis Castañeda (en adelante, "el Operador"). Al acceder o utilizar la Plataforma, ya sea como arquitecto suscriptor o como cliente de un arquitecto, usted acepta estos Términos y Condiciones en su totalidad. Si no está de acuerdo con alguna parte de estos Términos, no podrá acceder a la Plataforma.`],

  ['2. Descripción del servicio', `ArchPortal es una plataforma de software como servicio (SaaS) que permite a profesionales de la arquitectura y construcción: crear y gestionar portales de proyecto para sus clientes, compartir avances, bitácoras visuales, archivos y planos, llevar control de costos y cronogramas de obra, habilitar comunicación con sus clientes a través de un asistente con inteligencia artificial, y enviar notificaciones automáticas. El Operador se reserva el derecho de modificar, suspender o descontinuar cualquier parte del servicio con notificación previa de 30 días.`],

  ['3. Cuentas y registro', `Para utilizar ArchPortal como arquitecto suscriptor, el Usuario debe ser mayor de 18 años y tener capacidad legal para celebrar contratos conforme a la legislación mexicana. El Usuario se compromete a proporcionar información veraz, exacta y completa durante el registro. El Usuario es el único responsable de mantener la confidencialidad de sus credenciales y de todas las actividades realizadas desde su cuenta. Los arquitectos suscriptores pueden otorgar acceso a sus clientes finales y son responsables del uso que dichos clientes hagan de la Plataforma.`],

  ['4. Planes, pagos y facturación', `ArchPortal ofrece los siguientes planes de suscripción mensual recurrente:\n\n• Plan Básico: $840 MXN al mes, hasta 1 proyecto activo.\n• Plan Pro: $1,800 MXN al mes, hasta 5 proyectos activos.\n• Plan Despacho: $3,000 MXN al mes, hasta 20 proyectos activos.\n\nLos precios están expresados en pesos mexicanos e incluyen IVA. Todas las suscripciones incluyen un periodo de prueba gratuito de 7 días naturales contados a partir del registro, durante el cual el Usuario puede cancelar sin costo alguno. Al término del periodo de prueba, se realizará el primer cobro automático del plan seleccionado, salvo que el Usuario haya cancelado previamente. Las suscripciones se renuevan automáticamente cada mes hasta que el Usuario las cancele. Los pagos se procesan a través de Stripe, Inc.; ArchPortal no almacena datos de tarjetas en sus sistemas. El Operador se reserva el derecho de modificar los precios con aviso previo de 30 días.`],

  ['5. Periodo de prueba, cancelación y reembolsos', `Periodo de prueba: Todos los planes incluyen 7 días naturales de prueba gratuita. Durante este lapso, el Usuario puede cancelar su suscripción en cualquier momento sin que se realice cargo alguno. La cancelación durante el periodo de prueba se realiza desde el panel del Usuario en la sección "Mi cuenta → Gestionar suscripción", o enviando un correo a lcarq01@gmail.com.\n\nCancelación después del periodo de prueba: Una vez iniciados los cobros recurrentes, el Usuario puede cancelar en cualquier momento desde su panel o por correo. La cancelación será efectiva al término del periodo mensual ya pagado, conservando acceso a la Plataforma hasta esa fecha. Después de dicha fecha, no se realizan cobros adicionales.\n\nReembolsos: Una vez efectuado un cobro mensual recurrente, no se realizan reembolsos por periodos parciales o no utilizados, salvo en los casos previstos por la Ley Federal de Protección al Consumidor.\n\nSuspensión: El Operador podrá suspender o cancelar cuentas sin previo aviso en caso de violación de estos Términos, uso ilícito de la Plataforma, falta de pago o información falsa proporcionada durante el registro.`],

  ['6. Propiedad intelectual y datos', `La Plataforma, incluyendo su código fuente, diseño, marcas y logotipos, son propiedad exclusiva del Operador. El Usuario conserva todos los derechos sobre los datos, archivos, planos y fotografías que suba a la Plataforma. Al subir contenido, el Usuario otorga al Operador una licencia limitada y no exclusiva para almacenarlo y mostrarlo exclusivamente para prestar el servicio. El Operador NO venderá, cederá ni compartirá el contenido del Usuario con terceros con fines comerciales. El Usuario puede solicitar la exportación o eliminación de sus datos en cualquier momento escribiendo a lcarq01@gmail.com.`],

  ['7. Uso aceptable', `El Usuario se compromete a no utilizar la Plataforma para: subir o compartir contenido ilícito, difamatorio u obsceno; realizar ingeniería inversa o intentar acceder al código fuente; intentar acceder a cuentas o datos de otros usuarios; usar la Plataforma para enviar spam; sobrecargar intencionalmente la infraestructura; ni revender o sublicenciar el acceso sin autorización escrita del Operador.`],

  ['8. Limitación de responsabilidad', `ArchPortal se esfuerza por mantener el servicio disponible de manera continua pero no garantiza disponibilidad ininterrumpida. El Operador no será responsable por interrupciones causadas por mantenimiento, fallas de terceros proveedores (Supabase, Vercel, Stripe, etc.), fuerza mayor o ataques informáticos. El asistente de inteligencia artificial es una herramienta de apoyo y el arquitecto es el único responsable de verificar la información del proyecto. En ningún caso la responsabilidad total del Operador excederá el monto equivalente a los últimos 3 meses de suscripción pagados por el Usuario.`],

  ['9. Privacidad y protección de datos', `El tratamiento de los datos personales de los Usuarios se rige por el Aviso de Privacidad de ArchPortal, disponible en archportal.net/privacidad, el cual cumple con los requisitos de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento. Al aceptar estos Términos, el Usuario declara haber leído y aceptado el Aviso de Privacidad.`],

  ['10. Modificaciones a los Términos', `El Operador puede modificar estos Términos en cualquier momento. Los cambios serán notificados mediante correo electrónico y aviso en la Plataforma con 30 días de anticipación. Si el Usuario continúa utilizando la Plataforma después de dicho período, se entenderá que ha aceptado los nuevos Términos.`],

  ['11. Legislación aplicable y jurisdicción', `Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a la jurisdicción de los Tribunales competentes de la ciudad de Ensenada, Baja California, México, renunciando a cualquier otro fuero que pudiera corresponderles.`],

  ['12. Contacto', `Para cualquier duda, reclamación o solicitud relacionada con estos Términos:\n\nArchPortal — Luis Castañeda\nCorreo: lcarq01@gmail.com\nSitio web: archportal.net\nEnsenada, Baja California, México`],
]

export default function TermsModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 700 }}>

        {/* Header */}
        <div style={{ padding: '36px 48px 24px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 1 }}>
          <button className="modal-close" onClick={onClose}>✕</button>
          <p style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--g400)', marginBottom: 8 }}>ArchPortal</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 30, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>Términos y Condiciones de Uso</h2>
          <p style={{ fontSize: 12, fontWeight: 300, color: 'var(--g400)', marginBottom: 8 }}>Versión 1.1 — Mayo 2026</p>
          <div style={{ background: '#FEF4E4', border: '1px solid #F0C060', padding: '8px 14px', fontSize: 11, color: '#7A4A00', lineHeight: 1.6 }}>
            ⚠ Documento provisional. Los términos definitivos validados por un profesional legal estarán disponibles próximamente.
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '36px 48px', fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 300, color: 'var(--g600)', lineHeight: 1.9, maxHeight: '60vh', overflowY: 'auto' }}>

          <p style={{ marginBottom: 28, fontSize: 13, color: 'var(--g500)', lineHeight: 1.8 }}>
            Al registrarte o utilizar ArchPortal aceptas estar legalmente vinculado por estos Términos y Condiciones. Por favor léelos detenidamente antes de usar la Plataforma.
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
          <p style={{ fontSize: 11, color: 'var(--g400)', fontWeight: 300 }}>lcarq01@gmail.com</p>
          <button className="btn-submit" style={{ maxWidth: 160, marginTop: 0 }} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
