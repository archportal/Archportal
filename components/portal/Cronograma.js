'use client'

export default function Cronograma({ project, lang }) {
  const p = project?.project || project || {}
  const stages = project?.stages || p.stages || p.etapas || []

  const statusColor = {
    'Completado': { bg: '#EBF2E4', color: '#2D5016' },
    'En curso': { bg: '#FEF4E4', color: '#7A4A00' },
    'Pendiente': { bg: '#F0EFEC', color: '#6B6A62' },
  }

  return (
    <div>
      <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>Cronograma</h1>
        <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--g400)' }}>Fechas estimadas por etapa</p>
      </div>

      <div className="card">
        <div className="card-title">Etapas</div>
        {stages.length === 0 ? (
          <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--g400)' }}>Sin etapas definidas aún.</p>
        ) : (
          stages.map((e, i) => {
            const pct = e.porcentaje || e.pct || 0
            const sc = statusColor[e.estatus] || statusColor['Pendiente']
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: 'var(--g400)', flexShrink: 0, background: pct === 100 ? '#EBF2E4' : 'var(--white)' }}>
                  {pct === 100 ? '✓' : String(i+1).padStart(2,'0')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>{e.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--g400)' }}>{e.fechas || 'Por definir'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 120, height: 1, background: 'var(--border)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, height: 1, background: 'var(--ink)', width: pct + '%' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink)', width: 36, textAlign: 'right' }}>{pct}%</span>
                  <span style={{ fontSize: 9, padding: '3px 10px', background: sc.bg, color: sc.color, letterSpacing: '.08em', textTransform: 'uppercase', fontFamily: 'Jost, sans-serif' }}>{e.estatus || 'Pendiente'}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
