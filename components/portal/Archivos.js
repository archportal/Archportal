'use client'
import { useState } from 'react'

export default function Archivos({ project, user, lang, onRefresh, isArq }) {
  const p = project?.project || project || {}
  const files = project?.files || p.files || p.archivos || []
  const [deleting, setDeleting] = useState(null)
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const deleteFile = async (i) => {
    if (!confirm('¿Eliminar este archivo?')) return
    setDeleting(i)
    const newFiles = files.filter((_, idx) => idx !== i)
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, files: newFiles })
      })
      if (res.ok) { showToast('Archivo eliminado'); onRefresh?.() }
      else showToast('Error al eliminar')
    } catch { showToast('Error al eliminar') }
    finally { setDeleting(null) }
  }

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
                    <span style={{ fontSize: 9, padding: '3px 8px', background: f.tipo==='PDF'?'#FBE4E4':'#E4EBF8', color: f.tipo==='PDF'?'#8B1A1A':'#1A3A8B' }}>{f.tipo || 'FILE'}</span>
                  </td>
                  <td style={{ padding: '12px 12px 12px 0', fontSize: 12, color: 'var(--g500)' }}>{f.etapa || '—'}</td>
                  <td style={{ padding: '12px 12px 12px 0', fontSize: 12, color: 'var(--g400)' }}>{f.fecha}</td>
                  <td style={{ padding: '12px 0' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {f.url && (
                        <a href={f.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--ink)', textDecoration: 'none', border: '1px solid var(--border)', padding: '4px 12px', fontFamily: 'Jost, sans-serif', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                          Descargar
                        </a>
                      )}
                      {isArq && (
                        <button onClick={() => deleteFile(i)} disabled={deleting === i} style={{ fontSize: 11, color: '#B83232', background: 'transparent', border: '1px solid #B83232', padding: '4px 12px', fontFamily: 'Jost, sans-serif', letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: deleting === i ? .4 : 1 }}>
                          {deleting === i ? '...' : 'Eliminar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: 'var(--ink)', color: 'var(--white)', padding: '12px 24px', fontSize: 13, fontWeight: 300, zIndex: 9999 }}>{toast}</div>}
    </div>
  )
}
