'use client'
import { useEffect, useRef, useState } from 'react'

const fmt = n => '$' + Number(n||0).toLocaleString('es-MX')

const printStyles = `
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body * { visibility: hidden !important; }
  #dashboard-print, #dashboard-print * { visibility: visible !important; }
  #dashboard-print { position: absolute; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
  .portal-topbar { display: none !important; }
  body { background: white !important; }
  .card { break-inside: avoid; border: 1px solid #E2E1DC !important; }
  #dashboard-print .print-header {
    background: #1A1A18 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  #dashboard-print .print-header * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  #dashboard-print h1 { color: #ffffff !important; }
  #dashboard-print .print-header p { color: rgba(255,255,255,0.6) !important; }
  #dashboard-print .print-progress-bar {
    background: #C8A96E !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @page { margin: 1.5cm; size: A4; }
}
`

export default function Dashboard({ project, user, lang }) {
  const data = project || {}
  const p = data.project || data || {}
  const stages   = data.stages   || []
  const costs    = data.costs    || []
  const posts    = data.posts    || []
  const photos   = data.photos   || []
  const files    = data.files    || []
  const parseJson = (v) => { try { return typeof v==='string'?JSON.parse(v):(Array.isArray(v)?v:[]) } catch { return [] } }
  const notes = parseJson(p.notes)

  const avg         = stages.length ? Math.round(stages.reduce((s,e)=>s+(e.porcentaje||0),0)/stages.length) : 0
  const presupuesto = p.presupuesto || 0
  const ejercido    = p.pres_ejercido || 0
  const pagado      = p.pres_pagado || 0
  const porPagar    = Math.max(0, ejercido - pagado)
  const etapaActual  = stages.find(e=>e.estatus==='En curso')?.nombre || p.etapa_actual || 'Por iniciar'
  const siguienteEtapa = stages.find(e=>e.estatus==='Pendiente')?.nombre || '—'

  const pagadoPct   = presupuesto > 0 ? Math.round(pagado / presupuesto * 100) : 0
  const porPagarPct = presupuesto > 0 ? Math.round(porPagar / presupuesto * 100) : 0

  const barRef = useRef(null)
  const [lightbox, setLightbox] = useState(null) // {url, nombre, index}

  useEffect(() => {
    if (barRef.current) {
      setTimeout(() => { barRef.current.style.width = avg + '%' }, 100)
    }
  }, [avg])

  // Close lightbox on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight' && lightbox) setLightbox(photos[(lightbox.index+1)%photos.length] ? {...photos[(lightbox.index+1)%photos.length], index:(lightbox.index+1)%photos.length} : lightbox)
      if (e.key === 'ArrowLeft' && lightbox) { const prev = (lightbox.index-1+photos.length)%photos.length; setLightbox({...photos[prev], index:prev}) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightbox, photos])

  const t = lang==='en'
    ? {av:'Overall progress',pres:'Budget',ej:'Spent',pp:'To pay',ent:'Delivery',avEtapa:'Progress by stage',bitacora:'Visual log',archRec:'Recent files',cosRec:'Recent costs',info:'Project info',notas:'Resident log',notasCli:'Architect notes',noFotos:'No photos yet',noArch:'No files yet',noCostos:'No expenses yet',noNotas:'No notes published.',noNotasCli:'No notes yet.'}
    : {av:'Avance general',pres:'Presupuesto',ej:'Ejercido',pp:'Por pagar',ent:'Entrega estimada',avEtapa:'Avance por etapa',bitacora:'Bitácora visual',archRec:'Archivos recientes',cosRec:'Costos recientes',info:'Información del proyecto',notas:'Bitácora del residente',notasCli:'Notas del arquitecto',noFotos:'Sin fotos aún',noArch:'Sin archivos aún',noCostos:'Sin gastos aún',noNotas:'Sin notas publicadas.',noNotasCli:'Sin notas del arquitecto.'}

  if (!p.id) return <div style={{padding:48,color:'var(--g400)',fontWeight:300,fontSize:14}}>Cargando proyecto...</div>

  return (
    <div>
      <style>{printStyles}</style>

      {/* Botón exportar — solo visible en pantalla */}
      <div className="no-print" style={{display:'flex',justifyContent:'flex-end',padding:'0 0 12px'}}>
        <button onClick={()=>window.print()} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 18px',background:'var(--white)',border:'1px solid var(--border)',fontFamily:'Jost,sans-serif',fontSize:11,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--g500)',cursor:'pointer'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Exportar PDF
        </button>
      </div>

      <div id="dashboard-print">

      {/* LIGHTBOX */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{position:'fixed',inset:0,background:'rgba(12,12,12,.95)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out'}}>
          <button onClick={e=>{e.stopPropagation();const prev=(lightbox.index-1+photos.length)%photos.length;setLightbox({...photos[prev],index:prev})}} style={{position:'absolute',left:24,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.1)',border:'none',color:'#fff',fontSize:24,width:44,height:44,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
          <div onClick={e=>e.stopPropagation()} style={{maxWidth:'85vw',maxHeight:'85vh',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
            <img src={lightbox.url||lightbox.remoteUrl} alt={lightbox.nombre} style={{maxWidth:'100%',maxHeight:'78vh',objectFit:'contain'}}/>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <span style={{fontSize:12,color:'rgba(255,255,255,.5)',letterSpacing:'.04em'}}>{lightbox.nombre}</span>
              {lightbox.fecha && <span style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>{lightbox.fecha}</span>}
              <span style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>{lightbox.index+1} / {photos.length}</span>
            </div>
          </div>
          <button onClick={e=>{e.stopPropagation();const next=(lightbox.index+1)%photos.length;setLightbox({...photos[next],index:next})}} style={{position:'absolute',right:24,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.1)',border:'none',color:'#fff',fontSize:24,width:44,height:44,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
          <button onClick={()=>setLightbox(null)} style={{position:'absolute',top:20,right:20,background:'transparent',border:'none',color:'rgba(255,255,255,.5)',fontSize:20,cursor:'pointer',padding:8}}>✕</button>
        </div>
      )}

      {/* HERO */}
      <div style={{background:'var(--ink)',padding:'32px 28px',marginBottom:12,position:'relative',overflow:'hidden'}}>
        <div style={{position:'relative',zIndex:1}}>
          <div style={{fontSize:9,letterSpacing:'.2em',textTransform:'uppercase',color:'rgba(255,255,255,.3)',marginBottom:12}}>Proyecto activo</div>
          <h1 style={{fontFamily:'Cormorant Garamond, serif',fontSize:28,fontWeight:400,color:'#fff',marginBottom:4}}>{p.nombre}</h1>
          <p style={{fontSize:12,color:'rgba(255,255,255,.4)',marginBottom:24}}>{p.arquitecto} · {p.ubicacion}</p>
          <div style={{height:2,background:'rgba(255,255,255,.12)',marginBottom:8,position:'relative'}}>
            <div ref={barRef} style={{position:'absolute',top:0,left:0,height:2,background:'#fff',width:'0%',transition:'width 1s ease'}}/>
            <div style={{position:'absolute',right:0,top:-18,fontSize:11,color:'#fff',fontWeight:500}}>{avg}%</div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'rgba(255,255,255,.35)',letterSpacing:'.1em',textTransform:'uppercase'}}>
            <span>Inicio: {p.inicio||'—'}</span>
            <span>Avance general</span>
            <span>Entrega: {p.entrega||'Por definir'}</span>
          </div>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="metrics-grid" style={{marginBottom:12}}>
        {[
          [t.av, avg+'%', etapaActual+' en curso'],
          [t.pres, fmt(presupuesto), 'MXN aprobado'],
          [t.ej, fmt(ejercido), presupuesto>0?Math.round(ejercido/presupuesto*100)+'% del total':'0%'],
          [t.ent, p.entrega||'Por definir', 'Siguiente: '+siguienteEtapa],
        ].map(([label,val,sub])=>(
          <div key={label} className="metric-card">
            <div className="metric-label">{label}</div>
            <div className="metric-value" style={{fontSize:label===t.ent?22:undefined}}>{val}</div>
            <div className="metric-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* PRESUPUESTO + ETAPAS */}
      <div className="two-col" style={{marginBottom:12}}>

        {/* Presupuesto */}
        <div className="card">
          <div className="card-title">Desglose de presupuesto</div>
          {/* Barra visual */}
          <div style={{height:6,background:'var(--g100)',display:'flex',gap:2,marginBottom:10,overflow:'hidden'}}>
            <div style={{height:6,background:'var(--ink)',width:pagadoPct+'%',transition:'width .8s ease'}}/>
            <div style={{height:6,background:'var(--g300)',width:porPagarPct+'%',transition:'width .8s ease'}}/>
          </div>
          <div style={{display:'flex',gap:16,marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:8,height:8,background:'var(--ink)'}}></div><span style={{fontSize:11,color:'var(--g500)'}}>Pagado</span></div>
            <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:8,height:8,background:'var(--g300)'}}></div><span style={{fontSize:11,color:'var(--g500)'}}>Por pagar</span></div>
            <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:8,height:8,background:'var(--g100)',border:'1px solid var(--border)'}}></div><span style={{fontSize:11,color:'var(--g500)'}}>Disponible</span></div>
          </div>
          {/* 4 valores */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--border)'}}>
            {[
              ['Aprobado', fmt(presupuesto), 'var(--g100)', 'var(--ink)'],
              ['Ejercido', fmt(ejercido), 'var(--white)', 'var(--ink)'],
              ['Pagado', fmt(pagado), 'var(--white)', 'var(--ink)'],
              ['Por pagar', fmt(porPagar), '#FEF4E4', '#7A4A00'],
            ].map(([label,val,bg,color])=>(
              <div key={label} style={{background:bg,padding:'14px 16px'}}>
                <div style={{fontSize:9,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--g400)',marginBottom:6}}>{label}</div>
                <div style={{fontFamily:'Cormorant Garamond, serif',fontSize:20,fontWeight:300,color}}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Etapas */}
        <div className="card">
          <div className="card-title">{t.avEtapa}</div>
          {stages.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>Sin etapas definidas</p> : (
            stages.map((e,i)=>{
              const pct=e.porcentaje||0
              const color=pct===100?'#2D5016':pct>0?'var(--ink)':'var(--g200)'
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:color,flexShrink:0}}/>
                  <span style={{fontSize:12,fontWeight:300,color:'var(--g600)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombre}</span>
                  <div style={{flex:2,height:2,background:'var(--g100)',position:'relative',minWidth:60}}>
                    <div style={{position:'absolute',top:0,left:0,height:2,background:color,width:pct+'%',transition:'width .8s'}}/>
                  </div>
                  <span style={{fontSize:11,color:'var(--g400)',width:32,textAlign:'right'}}>{pct}%</span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* FOTOS + COSTOS */}
      <div className="two-col" style={{marginBottom:12}}>

        {/* Bitácora visual */}
        <div className="card">
          <div className="card-title">{t.bitacora} {photos.length>0&&<span style={{fontSize:11,color:'var(--g400)',fontWeight:300}}>· {photos.length} fotos</span>}</div>
          {photos.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>{t.noFotos}</p> : (
            <div style={{overflowY:'scroll',maxHeight:318,borderTop:'1px solid var(--g100)',marginTop:8,paddingTop:3}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:3}}>
                {photos.map((f,i)=>(
                  <div key={i} onClick={()=>setLightbox({...f,index:i})} style={{aspectRatio:'1',background:'var(--g100)',overflow:'hidden',position:'relative',cursor:'zoom-in'}}>
                    <img src={f.url||f.remoteUrl} alt={f.nombre} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .3s'}} onError={e=>e.target.style.display='none'}
                      onMouseEnter={e=>e.target.style.transform='scale(1.05)'}
                      onMouseLeave={e=>e.target.style.transform='scale(1)'}
                    />
                    <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(to top,rgba(12,12,12,.6) 0%,transparent 100%)',padding:'6px 8px'}}>
                      <div style={{fontSize:9,color:'#fff',letterSpacing:'.04em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.nombre}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Costos + Info */}
        <div className="card">
          <div className="card-title">{t.cosRec}</div>
          {costs.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>{t.noCostos}</p> : (
            costs.slice(0,4).map((c,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--g100)',gap:8}}>
                <span style={{fontSize:12,fontWeight:300,color:'var(--ink)',minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.concepto}</span>
                <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                  <span style={{fontSize:12,color:'var(--ink)'}}>{fmt(c.monto)}</span>
                  <span style={{fontSize:9,padding:'2px 6px',background:c.estatus==='Pagado'?'#EBF2E4':c.estatus==='Parcial'?'#FEF4E4':'#FBE4E4',color:c.estatus==='Pagado'?'#2D5016':c.estatus==='Parcial'?'#7A4A00':'#7A0000'}}>{c.estatus}</span>
                </div>
              </div>
            ))
          )}
          {/* Info proyecto compacta */}
          <div style={{marginTop:16,paddingTop:16,borderTop:'1px solid var(--border)'}}>
            <div className="card-title" style={{marginBottom:10}}>{t.info}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 16px'}}>
              {[['Superficie',p.superficie?p.superficie+' m²':null],['Niveles',p.niveles],['Arquitecto',p.arquitecto],['Inicio',p.inicio]].map(([label,val])=>val?(
                <div key={label}>
                  <div style={{fontSize:9,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--g400)',marginBottom:2}}>{label}</div>
                  <div style={{fontSize:12,fontWeight:300,color:'var(--ink)'}}>{val}</div>
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
            posts.slice(0,3).map((post,i)=>(
              <div key={i} style={{display:'flex',gap:14,padding:'12px 0',borderBottom:'1px solid var(--g100)'}}>
                <div style={{width:2,background:'var(--ink)',flexShrink:0,alignSelf:'stretch'}}/>
                <div>
                  <div style={{fontSize:10,color:'var(--g400)',marginBottom:4}}>{post.fecha}</div>
                  <div style={{fontSize:13,fontWeight:300,color:'var(--g600)',lineHeight:1.7}}>{post.texto}</div>
                  {post.autor && <div style={{fontSize:10,color:'var(--g400)',marginTop:4}}>{post.autor}</div>}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="card">
          <div className="card-title">{t.notasCli}</div>
          {notes.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>{t.noNotasCli}</p> : (
            notes.slice(0,3).map((nota,i)=>(
              <div key={i} style={{display:'flex',gap:14,padding:'12px 0',borderBottom:'1px solid var(--g100)'}}>
                <div style={{width:2,background:'var(--g300)',flexShrink:0,alignSelf:'stretch'}}/>
                <div>
                  <div style={{fontSize:10,color:'var(--g400)',marginBottom:4}}>{nota.fecha}</div>
                  <div style={{fontSize:13,fontWeight:300,color:'var(--g600)',lineHeight:1.7}}>{nota.texto}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      </div> {/* end dashboard-print */}
    </div>
  )
}
