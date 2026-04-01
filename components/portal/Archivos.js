'use client'

export default function Archivos({ project, lang }) {
  const p = project?.project || project || {}
  const files = project?.files || p.files || p.archivos || []

  return (
    <div>
      <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: 'var(--ink)', marginBottom: 4 }}>Archivos</h1>
        <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--g400)' }}>Planos, memorias y documentación</p>
      </div>

      <div className="card">
        <div className="card-title">Documentos del proyecto</div>
        {files.length === 0 ? (
          <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--g400)' }}>Sin archivos aún. El arquitecto los irá subiendo aquí.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Archivo','Tipo','Etapa','Fecha',''].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--g400)', padding: '8px 12px 8px 0', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 12px 12px 0', fontSize: 13, fontWeight: 300, color: 'var(--ink)' }}>{f.nombre}</td>
                  <td style={{ padding: '12px 12px 12px 0' }}>
                    <span style={{ fontSize: 9, padding: '3px 8px', background: '#FBE4E4', color: '#8B1A1A' }}>{f.tipo || 'FILE'}</span>
                  </td>
                  <td style={{ padding: '12px 12px 12px 0', fontSize: 12, color: 'var(--g500)' }}>{f.etapa || '—'}</td>
                  <td style={{ padding: '12px 12px 12px 0', fontSize: 12, color: 'var(--g400)' }}>{f.fecha}</td>
                  <td style={{ padding: '12px 0' }}>
                    {f.url && (
                      <a href={f.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--ink)', textDecoration: 'none', border: '1px solid var(--border)', padding: '4px 12px', fontFamily: 'Jost, sans-serif', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                        Descargar
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
