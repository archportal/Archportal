'use client'
import { useState } from 'react'

const CARD_RADIUS = 12
const INPUT_RADIUS = 6
const BTN_RADIUS = 6

// Ícono dorado para el título de la sección (carpeta)
const IconFolder = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
  </svg>
)

// Ícono de descarga (para botón)
const IconDownload = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

// Ícono de carpeta vacía grande (para estado sin archivos)
const IconFolderEmpty = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
  </svg>
)

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

  return (
    <div>
      <style>{`
        .archivos-root .card { border-radius: ${CARD_RADIUS}px !important; overflow: hidden; }
        .archivos-root .section-hero { border-radius: ${CARD_RADIUS}px !important; overflow: hidden; }
      `}</style>

      <div className="archivos-root">

      <div className="section-hero" style={{marginBottom:20}}>
        <div className="section-hero-eyebrow" style={{color:'var(--gold)',fontWeight:500}}>Proyecto · Documentación</div>
        <h1 className="section-hero-title">Archivos</h1>
        <p className="section-hero-sub">{files.length} documento{files.length!==1?'s':''} disponible{files.length!==1?'s':''}</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{color:'var(--gold)',display:'inline-flex',flexShrink:0}}><IconFolder /></span>
            <span>Documentos del proyecto</span>
          </div>
          <span style={{fontSize:12,color:'var(--g400)',fontWeight:300}}>{files.length} archivo{files.length!==1?'s':''}</span>
        </div>

        {files.length === 0 ? (
          <div style={{padding:'56px 0',textAlign:'center'}}>
            <div style={{color:'var(--g300)',marginBottom:16,display:'inline-flex'}}><IconFolderEmpty /></div>
            <p style={{fontSize:15,fontWeight:400,color:'var(--g500)',marginBottom:6}}>Sin archivos aún</p>
            <p style={{fontSize:12,color:'var(--g400)',fontWeight:300}}>El arquitecto irá subiendo los documentos aquí.</p>
          </div>
        ) : (
          <div style={{display:'grid',gap:10}}>
            {files.map((f,i)=>(
              <div key={i} style={{
                background:'var(--off)',
                border:'1px solid var(--border)',
                padding:'14px 16px',
                borderRadius:8,
                transition:'border-color .2s, box-shadow .2s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--ink)';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.04)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}
              >
                {/* Una sola fila: icono + info + acciones */}
                <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
                  <div style={{fontSize:24,flexShrink:0}}>{tipoIcon[f.tipo]||tipoIcon.Otro}</div>

                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:500,color:'var(--ink)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:4}}>{f.nombre}</div>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                      <span style={{
                        fontSize:10,
                        padding:'2px 8px',
                        letterSpacing:'.08em',
                        textTransform:'uppercase',
                        background:f.tipo==='PDF'?'#FBE4E4':f.tipo==='DWG'?'#E4EBF8':f.tipo==='XLS'?'#EBF2E4':'#F0EFEC',
                        color:f.tipo==='PDF'?'#8B1A1A':f.tipo==='DWG'?'#1A3A8B':f.tipo==='XLS'?'#2D5016':'#6B6A62',
                        fontWeight:600,
                        borderRadius:999,
                      }}>{f.tipo||'FILE'}</span>
                      {f.etapa && <span style={{fontSize:11,color:'var(--g500)',fontWeight:400}}>{f.etapa}</span>}
                      {f.fecha && <span style={{fontSize:11,color:'var(--g400)',fontWeight:300}}>· {f.fecha}</span>}
                    </div>
                  </div>

                  {/* Botones compactos */}
                  <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center'}}>
                    {f.url && (
                      <a href={f.url} target="_blank" rel="noreferrer"
                        style={{
                          display:'inline-flex',
                          alignItems:'center',
                          gap:6,
                          fontSize:11,
                          color:'var(--ink)',
                          background:'var(--white)',
                          border:'1px solid var(--border)',
                          textDecoration:'none',
                          padding:'7px 12px',
                          fontFamily:'Jost,sans-serif',
                          letterSpacing:'.06em',
                          textTransform:'uppercase',
                          fontWeight:500,
                          borderRadius:BTN_RADIUS,
                          transition:'all .15s',
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.background='var(--ink)';e.currentTarget.style.color='var(--white)';e.currentTarget.style.borderColor='var(--ink)'}}
                        onMouseLeave={e=>{e.currentTarget.style.background='var(--white)';e.currentTarget.style.color='var(--ink)';e.currentTarget.style.borderColor='var(--border)'}}>
                        <IconDownload />
                        <span>Descargar</span>
                      </a>
                    )}
                    {isArq && (
                      <button onClick={()=>deleteFile(i)} disabled={deleting===i}
                        style={{
                          fontSize:11,
                          color:'var(--danger)',
                          background:'transparent',
                          border:'1px solid var(--danger)',
                          padding:'7px 10px',
                          fontFamily:'Jost,sans-serif',
                          cursor:'pointer',
                          opacity:deleting===i?.4:1,
                          flexShrink:0,
                          borderRadius:BTN_RADIUS,
                          minWidth:32,
                          display:'inline-flex',
                          alignItems:'center',
                          justifyContent:'center',
                        }}>
                        {deleting===i?'...':'✕'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div style={{position:'fixed',bottom:32,left:'50%',transform:'translateX(-50%)',background:'var(--ink)',color:'var(--white)',padding:'12px 28px',fontSize:13,fontWeight:300,zIndex:9999,boxShadow:'0 8px 24px rgba(0,0,0,.2)',borderRadius:8}}>
          {toast}
        </div>
      )}

      </div>
    </div>
  )
}
