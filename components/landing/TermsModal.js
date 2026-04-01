'use client'

export default function TermsModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div style={{ padding: '40px 48px 28px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 1 }}>
          <button className="modal-close" onClick={onClose}>✕</button>
          <p style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--g400)', marginBottom: 8 }}>Arch Portal</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 32, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>Términos y Condiciones de Uso</h2>
          <p style={{ fontSize: 12, fontWeight: 300, color: 'var(--g400)' }}>Última actualización: 31 de marzo de 2026</p>
        </div>

        <div style={{ padding: '40px 48px', fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 300, color: 'var(--g600)', lineHeight: 1.9 }}>
          <p style={{ marginBottom: 20 }}>Bienvenido a Arch Portal. Al registrarte o utilizar Arch Portal, aceptas estar legalmente vinculado por estos Términos.</p>

          {[
            ['1. Descripción del Servicio', 'Arch Portal es un software como servicio (SaaS) diseñado para profesionales de la arquitectura, la construcción y el sector inmobiliario. La Plataforma ofrece herramientas para la gestión de proyectos de obra, almacenamiento de archivos, visualización de avances y facilitación de la comunicación entre los profesionales y sus clientes finales.'],
            ['2. Cuentas de Usuario y Seguridad', 'Debes crear una cuenta con información veraz y completa. Eres el único responsable de mantener la confidencialidad de tus credenciales y de todas las actividades que ocurran bajo tu cuenta. El administrador del proyecto gestiona los permisos de sus clientes.'],
            ['3. Propiedad Intelectual', 'Arch Portal retiene todos los derechos sobre el software, código, diseño e interfaz. Tú conservas todos los derechos sobre tus planos, renders, documentos y fotografías. Al subirlos otorgas una licencia no exclusiva solo para proveer el Servicio.'],
            ['4. Uso Aceptable', 'No uses la Plataforma para contenido ilegal, difamatorio o que infrinja derechos de autor. No intentes vulnerar la seguridad ni usar la Plataforma como almacenamiento masivo no relacionado con proyectos.'],
            ['5. Pagos y Cancelaciones', 'Los cobros son recurrentes según el ciclo elegido. Puedes cancelar en cualquier momento; aplica al final del ciclo actual sin reembolsos prorrateados.'],
            ['6. Limitación de Responsabilidad', 'Arch Portal no se hace responsable por errores de construcción o diseño, disputas entre arquitecto y cliente, ni pérdida accidental de datos. Se recomienda mantener respaldos propios. La responsabilidad máxima no excederá lo pagado en los últimos 12 meses.'],
            ['7. Disponibilidad', 'El Servicio puede interrumpirse temporalmente por mantenimiento o causas técnicas fuera de nuestro control.'],
            ['8. Modificaciones', 'Podemos modificar estos Términos en cualquier momento. El uso continuado constituye tu aceptación.'],
            ['9. Legislación Aplicable', 'Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Las disputas se someterán a los tribunales de Baja California, México.'],
            ['10. Contacto', 'Para preguntas sobre estos Términos contáctanos en: legal@archportal.mx'],
          ].map(([title, content]) => (
            <div key={title} style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 20, fontWeight: 400, color: 'var(--ink)', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>{title}</h3>
              <p>{content}</p>
            </div>
          ))}
        </div>

        <div style={{ padding: '24px 48px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-submit" style={{ maxWidth: 200 }} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
