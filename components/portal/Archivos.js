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
      const res = await fetch('/api/projects', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:p.id, files:newFiles }) })
      if (res.ok) { showToast('Archivo eliminado'); onRefresh?.() }
      else showToast('Error al eliminar')
    } catch { showToast('Error al eliminar') }
    finally { setDeleting(null) }
  }

  const tipoBg = { PDF:'#FBE4E4', DWG:'#E4EBF8', XLS:'#EBF2E4', IMG:'#F5F0E8', Otro:'#F0EFEC' }
  const tipoColor = { PDF:'#8B1A1A', DWG:'#1A3A8B', XLS:'#2D5016', IMG:'#5C4A1A', Otro:'#6B6A62' }

  return (
    <div>
      {/* Header */}
      <div style={{background:'var(--ink)',padding:'24px 28px',marginBottom:12}}>
        <div style={{fontSize:9,letterSpacing:'.2em',textTransform:'uppercase',color:'rgba(255,255,255,.3)',marginBottom:8}}>Proyecto · Documentación</div>
        <h1 style={{fontFamily:'Cormorant Garamond, serif',fontSize:28,fontWeight:400,color:'#fff'}}>Archivos</h1>
      </div>

      <div className="card">
        <div className="card-title" style={{marginBottom:16}}>Documentos del proyecto · {files.length} archivo{files.length!==1?'s':''}</div>
        {files.length === 0 ? (
          <div style={{padding:'32px 0',textAlign:'center'}}>
            <div style={{fontSize:13,fontWeight:300,color:'var(--g400)'}}>Sin archivos aún. El arquitecto los irá subiendo aquí.</div>
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['Archivo','Tipo','Etapa','Fecha',''].map(h=>(
                  <th key={h} style={{textAlign:'left',fontSize:9,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--g400)',padding:'0 12px 12px 0',fontWeight:400,borderBottom:'1px solid var(--border)'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.map((f,i)=>(
                <tr key={i} style={{borderBottom:'1px solid var(--g100)'}}>
                  <td style={{padding:'14px 12px 14px 0'}}>
                    <div style={{fontSize:13,fontWeight:400,color:'var(--ink)'}}>{f.nombre}</div>
                  </td>
                  <td style={{padding:'14px 12px 14px 0'}}>
                    <span style={{fontSize:9,padding:'3px 8px',background:tipoBg[f.tipo]||tipoBg.Otro,color:tipoColor[f.tipo]||tipoColor.Otro,letterSpacing:'.06em'}}>{f.tipo||'FILE'}</span>
                  </td>
                  <td style={{padding:'14px 12px 14px 0',fontSize:12,color:'var(--g500)'}}>{f.etapa||'—'}</td>
                  <td style={{padding:'14px 12px 14px 0',fontSize:12,color:'var(--g400)'}}>{f.fecha}</td>
                  <td style={{padding:'14px 0'}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',justifyContent:'flex-end'}}>
                      {f.url && (
                        <a href={f.url} target="_blank" rel="noreferrer" style={{fontSize:11,color:'var(--ink)',textDecoration:'none',border:'1px solid var(--border)',padding:'5px 14px',fontFamily:'Jost,sans-serif',letterSpacing:'.06em',textTransform:'uppercase'}}>
                          Descargar
                        </a>
                      )}
                      {isArq && (
                        <button onClick={()=>deleteFile(i)} disabled={deleting===i} style={{fontSize:11,color:'#B83232',background:'transparent',border:'1px solid #B83232',padding:'5px 14px',fontFamily:'Jost,sans-serif',letterSpacing:'.06em',textTransform:'uppercase',cursor:'pointer',opacity:deleting===i?.4:1}}>
                          {deleting===i?'...':'Eliminar'}
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

      {toast && <div style={{position:'fixed',bottom:32,left:'50%',transform:'translateX(-50%)',background:'var(--ink)',color:'var(--white)',padding:'12px 24px',fontSize:13,fontWeight:300,zIndex:9999}}>{toast}</div>}
    </div>
  )
}
