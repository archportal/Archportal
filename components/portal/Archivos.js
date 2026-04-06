'use client'
import { useState } from 'react'

export default function Archivos({ project, user, lang, onRefresh, isArq }) {
  const p = project?.project || project || {}
  const files = project?.files || p.files || []
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

  const tipoIcon = { PDF:'📄', DWG:'📐', XLS:'📊', IMG:'🖼️', Otro:'📁' }
  const tipoChip = { PDF:'chip-red', DWG:'chip-blue', XLS:'chip-green', IMG:'chip-warn', Otro:'chip-gray' }

  return (
    <div>
      <div className="section-hero" style={{marginBottom:20}}>
        <div className="section-hero-eyebrow">Proyecto · Documentación</div>
        <h1 className="section-hero-title">Archivos</h1>
        <p className="section-hero-sub">{files.length} documento{files.length!==1?'s':''} disponible{files.length!==1?'s':''}</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Documentos del proyecto</div>
          <span style={{fontSize:12,color:'var(--g400)',fontWeight:300}}>{files.length} archivo{files.length!==1?'s':''}</span>
        </div>
        {files.length === 0 ? (
          <div style={{padding:'48px 0',textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:16}}>📁</div>
            <p style={{fontSize:15,fontWeight:300,color:'var(--g400)',marginBottom:4}}>Sin archivos aún</p>
            <p style={{fontSize:12,color:'var(--g300)'}}>El arquitecto irá subiendo los documentos aquí.</p>
          </div>
        ) : (
          <div style={{display:'grid',gap:8}}>
            {files.map((f,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',background:'var(--off)',border:'1px solid var(--border)',transition:'all .2s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--ink)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
              >
                <div style={{fontSize:28,flexShrink:0}}>{tipoIcon[f.tipo]||tipoIcon.Otro}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:500,color:'var(--ink)',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.nombre}</div>
                  <div style={{display:'flex',gap:12,alignItems:'center'}}>
                    <span style={{fontSize:10,padding:'3px 8px',letterSpacing:'.06em',textTransform:'uppercase',background:f.tipo==='PDF'?'#FBE4E4':f.tipo==='DWG'?'#E4EBF8':f.tipo==='XLS'?'#EBF2E4':'#F0EFEC',color:f.tipo==='PDF'?'#8B1A1A':f.tipo==='DWG'?'#1A3A8B':f.tipo==='XLS'?'#2D5016':'#6B6A62',fontWeight:500}}>{f.tipo||'FILE'}</span>
                    {f.etapa && <span style={{fontSize:11,color:'var(--g400)'}}>{f.etapa}</span>}
                    {f.fecha && <span style={{fontSize:11,color:'var(--g300)'}}>{f.fecha}</span>}
                  </div>
                </div>
                <div style={{display:'flex',gap:8,flexShrink:0}}>
                  {f.url && (
                    <a href={f.url} target="_blank" rel="noreferrer" style={{fontSize:11,color:'var(--white)',background:'var(--ink)',textDecoration:'none',padding:'8px 18px',fontFamily:'Jost,sans-serif',letterSpacing:'.06em',textTransform:'uppercase',fontWeight:500,transition:'opacity .2s'}}
                      onMouseEnter={e=>e.currentTarget.style.opacity='.8'}
                      onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                      Descargar
                    </a>
                  )}
                  {isArq && (
                    <button onClick={()=>deleteFile(i)} disabled={deleting===i} style={{fontSize:11,color:'var(--danger)',background:'transparent',border:'1px solid var(--danger)',padding:'8px 14px',fontFamily:'Jost,sans-serif',letterSpacing:'.06em',textTransform:'uppercase',cursor:'pointer',opacity:deleting===i?.4:1}}>
                      {deleting===i?'...':'✕'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div style={{position:'fixed',bottom:32,left:'50%',transform:'translateX(-50%)',background:'var(--ink)',color:'var(--white)',padding:'12px 28px',fontSize:13,fontWeight:300,zIndex:9999,boxShadow:'0 8px 24px rgba(0,0,0,.2)'}}>{toast}</div>}
    </div>
  )
}
