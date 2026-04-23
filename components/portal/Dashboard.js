'use client'
import { useEffect, useRef, useState } from 'react'

const fmt = n => '$' + Number(n||0).toLocaleString('es-MX')

// Convierte fecha "YYYY-MM-DD" (u otros formatos) a timestamp para ordenar.
// Si la fecha es inválida o falta, devuelve 0 para que se vaya hasta atrás.
function fechaTs(f) {
  if (!f) return 0
  const t = new Date(f).getTime()
  return isNaN(t) ? 0 : t
}

const printStyles = `
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body * { visibility: hidden !important; }
  #dashboard-print, #dashboard-print * { visibility: visible !important; }
  #dashboard-print { position: absolute; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
  .portal-topbar { display: none !important; }
  .section-hero { background: #0C0C0C !important; }
  @page { margin: 1.5cm; size: A4; }
}
`

function progressMessage(avg, lang) {
  if (lang === 'en') {
    if (avg === 0) return 'Your project is just getting started 🏗️'
    if (avg < 25) return 'Great start — foundations are being set'
    if (avg < 50) return 'Making good progress on your project'
    if (avg < 75) return "You're past the halfway mark! 🎉"
    if (avg < 100) return 'Almost there — final stretch!'
    return 'Project completed ✓'
  }
  if (avg === 0) return 'Tu proyecto está comenzando 🏗️'
  if (avg < 25) return 'Buen inicio — las bases están en marcha'
  if (avg < 50) return 'Tu proyecto avanza correctamente'
  if (avg < 75) return '¡Ya vas a más de la mitad! 🎉'
  if (avg < 100) return 'En la recta final — casi listo'
  return 'Proyecto completado ✓'
}

export default function Dashboard({ project, user, lang }) {
  const data = project || {}
  const p = data.project || data || {}
  const stages  = data.stages  || []
  const costs   = data.costs   || []
  const posts   = data.posts   || []
  const photos  = data.photos  || []
  const isArq   = user?.role === 'arq' || user?.impersonated
  const parseJson = (v) => { try { return typeof v==='string'?JSON.parse(v):(Array.isArray(v)?v:[]) } catch { return [] } }
  const notes = parseJson(p.notes)

  const avg          = stages.length ? Math.round(stages.reduce((s,e)=>s+(e.porcentaje||0),0)/stages.length) : 0
  const presupuesto  = p.presupuesto || 0
  const totalGastos  = costs.reduce((s,c)=>s+(parseInt(c.monto)||0),0)
  const pagado       = p.pres_pagado || 0
  const porPagar     = Math.max(0, (p.pres_ejercido||0) - pagado)
  const etapaActual  = stages.find(e=>e.estatus==='En curso')?.nombre || p.etapa_actual || 'Por iniciar'
  const siguienteEtapa = stages.find(e=>e.estatus==='Pendiente')?.nombre || '—'
  const etapasCompletadas = stages.filter(e=>e.estatus==='Completado').length
  const pagadoPct    = presupuesto > 0 ? Math.round(pagado/presupuesto*100) : 0
  const porPagarPct  = presupuesto > 0 ? Math.round(porPagar/presupuesto*100) : 0

  // Costos recientes: los 5 más recientes por fecha (descendente).
  // Los que no tienen fecha quedan al final.
  const costsRecientes = [...costs]
    .sort((a, b) => fechaTs(b.fecha) - fechaTs(a.fecha))
    .slice(0, 5)

  const [lightbox, setLightbox] = useState(null)
  const [barW, setBarW] = useState(0)

  useEffect(() => { setTimeout(() => setBarW(avg), 200) }, [avg])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key==='Escape') setLightbox(null)
      if (e.key==='ArrowRight' && lightbox) { const next=(lightbox.index+1)%photos.length; setLightbox({...photos[next],index:next}) }
      if (e.key==='ArrowLeft'  && lightbox) { const prev=(lightbox.index-1+photos.length)%photos.length; setLightbox({...photos[prev],index:prev}) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightbox, photos])

  const t = lang==='en'
    ? {av:'Overall progress',pres:'Budget',ej:'Total spent',pp:'To pay',ent:'Est. delivery',avEtapa:'Progress by stage',bitacora:'Visual log',cosRec:'Recent costs',info:'Project info',notas:'Resident log',notasCli:'Architect notes',noFotos:'No photos yet',noCostos:'No expenses yet',noNotas:'No notes published.',noNotasCli:'No notes yet.'}
    : {av:'Avance general',pres:'Presupuesto',ej:'Gastado hasta hoy',pp:'Por pagar',ent:'Entrega estimada',avEtapa:'Avance por etapa',bitacora:'Bitácora visual',cosRec:'Costos recientes',info:'Información del proyecto',notas:'Bitácora del residente',notasCli:'Notas del arquitecto',noFotos:'Sin fotos aún',noCostos:'Sin gastos aún',noNotas:'Sin notas publicadas.',noNotasCli:'Sin notas del arquitecto.'}

  if (!p.id) return <div style={{padding:48,color:'var(--g400)',fontSize:14,fontWeight:300}}>Cargando proyecto...</div>

  return (
    <div>
      <style>{printStyles}</style>

      {/* Export button */}
      <div className="no-print" style={{display:'flex',justifyContent:'flex-end',padding:'0 0 16px'}}>
        <button onClick={()=>window.print()} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 20px',background:'var(--white)',border:'1px solid var(--border)',fontFamily:'Jost,sans-serif',fontSize:11,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--g500)',cursor:'pointer',transition:'all .2s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--ink)';e.currentTarget.style.color='var(--ink)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--g500)'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Exportar PDF
        </button>
      </div>

      <div id="dashboard-print">

      {/* LIGHTBOX */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{position:'fixed',inset:0,background:'rgba(12,12,12,.96)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out'}}>
          <button onClick={e=>{e.stopPropagation();const prev=(lightbox.index-1+photos.length)%photos.length;setLightbox({...photos[prev],index:prev})}} style={{position:'absolute',left:24,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.1)',border:'none',color:'#fff',fontSize:28,width:48,height:48,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
          <div onClick={e=>e.stopPropagation()} style={{maxWidth:'85vw',maxHeight:'85vh',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
            <img src={lightbox.url||lightbox.remoteUrl} alt={lightbox.nombre} style={{maxWidth:'100%',maxHeight:'78vh',objectFit:'contain'}}/>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <span style={{fontSize:12,color:'rgba(255,255,255,.5)'}}>{lightbox.nombre}</span>
              {lightbox.fecha && <span style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>{lightbox.fecha}</span>}
              <span style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>{lightbox.index+1} / {photos.length}</span>
            </div>
          </div>
          <button onClick={e=>{e.stopPropagation();const next=(lightbox.index+1)%photos.length;setLightbox({...photos[next],index:next})}} style={{position:'absolute',right:24,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.1)',border:'none',color:'#fff',fontSize:28,width:48,height:48,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
          <button onClick={()=>setLightbox(null)} style={{position:'absolute',top:20,right:20,background:'transparent',border:'none',color:'rgba(255,255,255,.5)',fontSize:20,cursor:'pointer',padding:8}}>✕</button>
        </div>
      )}

      {/* HERO */}
      <div className="section-hero" style={{marginBottom:20}}>
        <div className="section-hero-eyebrow">Proyecto activo</div>
        <h1 className="section-hero-title">{p.nombre}</h1>
        <p className="section-hero-sub">{p.arquitecto} · {p.ubicacion}</p>

        {/* Barra de progreso prominente */}
        <div style={{marginTop:24,marginBottom:4}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:10}}>
            <div>
              <div style={{fontSize:10,letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(255,255,255,.35)',marginBottom:4}}>
                {lang==='en' ? 'Current stage' : 'Etapa actual'}
              </div>
              <div style={{fontSize:14,color:'rgba(255,255,255,.85)',fontWeight:400}}>{etapaActual}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:48,fontWeight:300,color:'var(--white)',lineHeight:1}}>{avg}%</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:2}}>
                {etapasCompletadas} {lang==='en'?'of':'de'} {stages.length} {lang==='en'?'stages':'etapas'}
              </div>
            </div>
          </div>
          <div style={{height:10,background:'rgba(255,255,255,.1)',borderRadius:5,overflow:'hidden',marginBottom:12}}>
            <div style={{height:10,background:'linear-gradient(90deg,var(--gold),#e8c27a)',borderRadius:5,width:barW+'%',transition:'width 1.4s ease'}}/>
          </div>
          {/* Mensaje motivacional */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:12,color:'rgba(255,255,255,.5)',fontStyle:'italic'}}>{progressMessage(avg, lang)}</span>
            <span style={{fontSize:10,color:'rgba(255,255,255,.35)',letterSpacing:'.06em',textTransform:'uppercase'}}>
              {lang==='en'?'Delivery:':'Entrega:'} {p.entrega||'Por definir'}
            </span>
          </div>
        </div>
      </div>

      {/* MÉTRICAS — labels amigables para cliente */}
      <div className="metrics-grid" style={{marginBottom:20}}>
        {[
          {label:t.av,   val:avg+'%',           sub:etapaActual+' en curso'},
          {label:t.pres, val:fmt(presupuesto),   sub:'MXN aprobado'},
          {label:t.ej,   val:fmt(totalGastos),   sub:presupuesto>0?Math.round(totalGastos/presupuesto*100)+'% del presupuesto':'—'},
          {label:t.ent,  val:p.entrega||'—',     sub:'Siguiente: '+siguienteEtapa, small:true},
        ].map(({label,val,sub,accent,small})=>(
          <div key={label} className={`metric-card${accent?' accent':''}`}>
            <div className="metric-label">{label}</div>
            <div className="metric-value" style={small?{fontSize:22}:{}}>{val}</div>
            <div className="metric-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* ETAPAS */}
      <div style={{marginBottom:16}}>
        <div className="card">
          <div className="card-title">{t.avEtapa}</div>
          {stages.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>Sin etapas definidas</p> : (
            stages.map((e,i)=>{
              const pct = e.porcentaje||0
              const color = pct===100?'var(--success)':pct>0?'var(--ink)':'var(--g200)'
              return (
                <div key={i} className="stage-row">
                  <div className="stage-dot" style={{background:color}}/>
                  <span className="stage-name" style={{fontWeight:pct>0?400:300}}>{e.nombre}</span>
                  <div style={{flex:2,minWidth:60}}>
                    <div className="progress-bar-wrap" style={{height:6}}>
                      <div className="progress-bar-fill" style={{background:color,width:pct+'%',height:6,borderRadius:3,transition:'width .8s'}}/>
                    </div>
                  </div>
                  <span className="stage-pct">{pct}%</span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* FOTOS + COSTOS */}
      <div className="two-col" style={{marginBottom:16}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">{t.bitacora}</div>
            {photos.length>0 && <span style={{fontSize:12,color:'var(--g400)',fontWeight:300}}>{photos.length} fotos</span>}
          </div>
          {photos.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>{t.noFotos}</p> : (
            <div style={{overflowY:'scroll',maxHeight:320,marginTop:4}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4}}>
                {photos.map((f,i)=>(
                  <div key={i} onClick={()=>setLightbox({...f,index:i})} style={{aspectRatio:'1',background:'var(--g100)',overflow:'hidden',position:'relative',cursor:'zoom-in',borderRadius:2}}>
                    <img src={f.url||f.remoteUrl} alt={f.nombre} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .3s'}}
                      onError={e=>e.target.style.display='none'}
                      onMouseEnter={e=>e.target.style.transform='scale(1.06)'}
                      onMouseLeave={e=>e.target.style.transform='scale(1)'}
                    />
                    <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(to top,rgba(12,12,12,.65) 0%,transparent 100%)',padding:'8px'}}>
                      <div style={{fontSize:9,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.nombre}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">{t.cosRec}</div>
          {costs.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>{t.noCostos}</p> : (
            costsRecientes.map((c,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--g100)',gap:8}}>
                <div style={{minWidth:0,flex:1,overflow:'hidden'}}>
                  <div style={{fontSize:13,fontWeight:300,color:'var(--ink)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.concepto}</div>
                  {c.fecha && <div style={{fontSize:10,color:'var(--g400)',marginTop:2}}>{c.fecha}</div>}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                  <span style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{fmt(c.monto)}</span>
                  <span className={`chip chip-${c.estatus==='Pagado'?'green':c.estatus==='Parcial'?'warn':'red'}`}>{c.estatus}</span>
                </div>
              </div>
            ))
          )}
          <div style={{marginTop:20,paddingTop:16,borderTop:'1px solid var(--border)'}}>
            <div className="card-title" style={{marginBottom:12}}>{t.info}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 16px'}}>
              {[['Superficie',p.superficie?p.superficie+' m²':null],['Niveles',p.niveles],['Arquitecto',p.arquitecto],['Inicio',p.inicio]].map(([label,val])=>val?(
                <div key={label}>
                  <div style={{fontSize:9,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--g400)',marginBottom:3}}>{label}</div>
                  <div style={{fontSize:13,fontWeight:400,color:'var(--ink)'}}>{val}</div>
                </div>
              ):null)}
            </div>
          </div>
        </div>
      </div>

      {/* NOTAS */}
      <div className="two-col">
        <div className="card">
          <div className="card-title">{t.notas}</div>
          {posts.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>{t.noNotas}</p> : (
            <div style={{maxHeight:200,overflowY:'auto',paddingRight:4}}>
              {posts.map((post,i)=>(
                <div key={i} className="note-item">
                  <div className="note-accent" style={{background:'var(--ink)'}}/>
                  <div>
                    <div className="note-date">{post.fecha}</div>
                    <div className="note-text">{post.texto}</div>
                    {post.autor && <div style={{fontSize:10,color:'var(--g400)',marginTop:4}}>{post.autor}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-title">{t.notasCli}</div>
          {notes.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>{t.noNotasCli}</p> : (
            <div style={{maxHeight:200,overflowY:'auto',paddingRight:4}}>
              {notes.map((nota,i)=>(
                <div key={i} className="note-item">
                  <div className="note-accent" style={{background:'var(--gold)'}}/>
                  <div>
                    <div className="note-date">{nota.fecha}</div>
                    <div className="note-text">{nota.texto}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      </div>
    </div>
  )
}
