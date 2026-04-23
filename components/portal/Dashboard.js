'use client'
import { useEffect, useRef, useState } from 'react'

const fmt = n => '$' + Number(n||0).toLocaleString('es-MX')

function fechaTs(f) {
  if (!f) return 0
  const t = new Date(f).getTime()
  return isNaN(t) ? 0 : t
}

const CARD_RADIUS = 12

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

const dashStyles = `
#dashboard-print .card {
  border-radius: ${CARD_RADIUS}px !important;
  overflow: hidden;
}
#dashboard-print .section-hero {
  border-radius: ${CARD_RADIUS}px !important;
  overflow: hidden;
}

#dashboard-print .dash-card-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
#dashboard-print .dash-card-title-icon {
  color: var(--gold);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

#dashboard-print .dash-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 14px;
  font-size: 11px;
  color: rgba(255,255,255,.5);
  font-weight: 300;
  letter-spacing: .02em;
}
#dashboard-print .dash-hero-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
#dashboard-print .dash-hero-meta-label {
  color: rgba(255,255,255,.35);
  text-transform: uppercase;
  letter-spacing: .1em;
  font-size: 9px;
  font-weight: 500;
}
#dashboard-print .dash-hero-meta-sep {
  color: rgba(255,255,255,.2);
}

#dashboard-print .dash-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
@media (max-width: 1024px) {
  #dashboard-print .dash-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 560px) {
  #dashboard-print .dash-metrics-grid {
    grid-template-columns: 1fr;
  }
}

#dashboard-print .dash-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
@media (max-width: 900px) {
  #dashboard-print .dash-two-col {
    grid-template-columns: 1fr;
  }
}

#dashboard-print .dash-hero {
  display: flex;
  gap: 0;
  align-items: stretch;
  flex-wrap: wrap;
  padding: 0;
  overflow: hidden;
  margin-bottom: 20px;
}
#dashboard-print .dash-hero-info {
  flex: 1 1 420px;
  min-width: 0;
  padding: 32px 36px;
}
#dashboard-print .dash-hero-image {
  flex: 0 1 380px;
  align-self: stretch;
  min-height: 260px;
  position: relative;
  overflow: hidden;
  cursor: zoom-in;
  background: rgba(255,255,255,.05);
}
@media (max-width: 780px) {
  #dashboard-print .dash-hero-info {
    padding: 24px 22px;
    flex: 1 1 100%;
  }
  #dashboard-print .dash-hero-image {
    flex: 1 1 100%;
    min-height: 220px;
  }
}

#dashboard-print .dash-photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
@media (max-width: 420px) {
  #dashboard-print .dash-photos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

#dashboard-print .dash-log-item {
  display: flex;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--border);
}
#dashboard-print .dash-log-item:last-child {
  border-bottom: none;
}
#dashboard-print .dash-log-accent {
  flex-shrink: 0;
  width: 3px;
  background: var(--ink);
  border-radius: 2px;
}
#dashboard-print .dash-log-body {
  flex: 1;
  min-width: 0;
}
#dashboard-print .dash-log-date {
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--gold);
  font-weight: 600;
  margin-bottom: 8px;
}
#dashboard-print .dash-log-text {
  font-size: 15px;
  line-height: 1.65;
  color: var(--ink);
  font-weight: 400;
  margin-bottom: 6px;
  white-space: pre-wrap;
  word-break: break-word;
}
#dashboard-print .dash-log-author {
  font-size: 11px;
  color: var(--g500);
  font-weight: 500;
  letter-spacing: .04em;
}
@media (max-width: 560px) {
  #dashboard-print .dash-log-text {
    font-size: 14px;
  }
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

const IconChart = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20h18"/>
    <rect x="5" y="13" width="3" height="6"/>
    <rect x="10.5" y="9" width="3" height="10"/>
    <rect x="16" y="5" width="3" height="14"/>
  </svg>
)
const IconMoney = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M14.5 9.5c-.5-.9-1.5-1.5-2.5-1.5-1.7 0-3 1-3 2.3 0 1.2 1 1.9 2.5 2.2l1 .2c1.5.3 2.5 1 2.5 2.2 0 1.3-1.3 2.3-3 2.3-1 0-2-.6-2.5-1.5"/>
    <path d="M12 7v1M12 16v1"/>
  </svg>
)
const IconWallet = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2"/>
    <path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2z"/>
    <circle cx="16.5" cy="13.5" r="1.2" fill="currentColor"/>
  </svg>
)
const IconCalendar = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18"/>
    <path d="M8 3v4M16 3v4"/>
  </svg>
)
const IconPercent = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19"/>
    <circle cx="7.5" cy="7.5" r="2.5"/>
    <circle cx="16.5" cy="16.5" r="2.5"/>
  </svg>
)
const IconCamera = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1z" transform="translate(0, -0.5)"/>
    <circle cx="12" cy="13" r="3.5"/>
  </svg>
)
const IconNotebook = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
    <line x1="9" y1="8" x2="16" y2="8"/>
    <line x1="9" y1="12" x2="16" y2="12"/>
    <line x1="9" y1="16" x2="13" y2="16"/>
    <line x1="5" y1="7" x2="3" y2="7"/>
    <line x1="5" y1="12" x2="3" y2="12"/>
    <line x1="5" y1="17" x2="3" y2="17"/>
  </svg>
)

// ========== FIX: Parsea fechas en formato DD/MM/YYYY (es-MX) ==========
function parseFechaMX(str) {
  if (!str) return 0
  if (typeof str === 'string' && str.includes('/')) {
    const parts = str.split('/').map(n => parseInt(n, 10))
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [dd, mm, yyyy] = parts
      const year = yyyy < 100 ? 2000 + yyyy : yyyy
      const t = new Date(year, mm - 1, dd).getTime()
      if (!isNaN(t)) return t
    }
  }
  const t = new Date(str).getTime()
  return isNaN(t) ? 0 : t
}

// ========== FIX: getFotoReciente ==========
// El backend ya devuelve las fotos ordenadas por created_at DESC
// (ver /api/projects/route.js → .order('created_at', { ascending: false }))
// Así que photos[0] SIEMPRE es la más reciente.
// Como respaldo extra, si alguna tiene created_at, lo usamos para confirmar orden.
function getFotoReciente(photos) {
  if (!photos || photos.length === 0) return null

  // Si alguna foto tiene created_at (timestamp ISO del backend), usamos ese
  // para ordenar con máxima precisión (incluye hora/minuto/segundo)
  const conCreatedAt = photos.filter(f => f.created_at)
  if (conCreatedAt.length > 0) {
    const ordenadas = [...conCreatedAt].sort((a, b) => {
      const ta = new Date(a.created_at).getTime() || 0
      const tb = new Date(b.created_at).getTime() || 0
      return tb - ta // Más reciente primero
    })
    return ordenadas[0]
  }

  // Sin created_at: intentamos ordenar por el campo "fecha" (DD/MM/YYYY)
  const conFecha = photos
    .map((f, idx) => ({ ...f, _ts: parseFechaMX(f.fecha), _idx: idx }))
    .filter(f => f._ts > 0)

  if (conFecha.length > 0) {
    const ordenadas = [...conFecha].sort((a, b) => b._ts - a._ts)
    const { _ts, _idx, ...limpia } = ordenadas[0]
    return limpia
  }

  // Último fallback: photos[0] porque el backend ordena DESC
  return photos[0]
}

export default function Dashboard({ project, user, lang }) {
  const data = project || {}
  const p = data.project || data || {}
  const stages  = data.stages  || []
  const costs   = data.costs   || []
  const posts   = data.posts   || []
  const photos  = data.photos  || []
  const isArq   = user?.role === 'arq' || user?.impersonated

  const avg          = stages.length ? Math.round(stages.reduce((s,e)=>s+(e.porcentaje||0),0)/stages.length) : 0
  const presupuesto  = p.presupuesto || 0
  const totalGastos  = costs.reduce((s,c)=>s+(parseInt(c.monto)||0),0)
  const etapaActual  = stages.find(e=>e.estatus==='En curso')?.nombre || p.etapa_actual || 'Por iniciar'
  const siguienteEtapa = stages.find(e=>e.estatus==='Pendiente')?.nombre || '—'
  const etapasCompletadas = stages.filter(e=>e.estatus==='Completado').length

  const fotoReciente = getFotoReciente(photos)

  const metaItems = [
    p.superficie ? { label: lang==='en'?'Area':'Superficie', val: p.superficie + ' m²' } : null,
    p.niveles ? { label: lang==='en'?'Levels':'Niveles', val: p.niveles } : null,
    p.arquitecto ? { label: lang==='en'?'Architect':'Arquitecto', val: p.arquitecto } : null,
    p.inicio ? { label: lang==='en'?'Start':'Inicio', val: p.inicio } : null,
  ].filter(Boolean)

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
    ? {av:'Overall progress',pres:'Budget',ej:'Total spent',ent:'Est. delivery',avEtapa:'Progress by stage',bitacora:'Visual log',bitacoraNotas:'Log',noFotos:'No photos yet',noNotas:'No notes published.'}
    : {av:'Avance general',pres:'Presupuesto',ej:'Gastado hasta hoy',ent:'Entrega estimada',avEtapa:'Avance por etapa',bitacora:'Bitácora visual',bitacoraNotas:'Bitácora',noFotos:'Sin fotos aún',noNotas:'Sin notas publicadas.'}

  if (!p.id) return <div style={{padding:48,color:'var(--g400)',fontSize:14,fontWeight:300}}>Cargando proyecto...</div>

  const metricCard = {
    background:'var(--white)',
    border:'1px solid var(--border)',
    borderRadius: CARD_RADIUS,
    padding:'22px 24px',
    display:'flex',
    alignItems:'flex-start',
    gap:18,
    minWidth:0,
  }
  const metricIconWrap = {
    flexShrink:0,
    width:48,
    height:48,
    borderRadius:'50%',
    background:'rgba(197,164,109,0.12)',
    color:'var(--gold)',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
  }
  const metricLabel = {
    fontSize:10,
    letterSpacing:'.14em',
    textTransform:'uppercase',
    color:'var(--g400)',
    marginBottom:6,
  }
  const metricValue = {
    fontFamily:'Cormorant Garamond, serif',
    fontSize:34,
    fontWeight:400,
    color:'var(--ink)',
    lineHeight:1.1,
    marginBottom:4,
    overflow:'hidden',
    textOverflow:'ellipsis',
    whiteSpace:'nowrap',
  }
  const metricSub = {
    fontSize:12,
    color:'var(--g400)',
    fontWeight:300,
  }

  return (
    <div>
      <style>{printStyles + dashStyles}</style>

      <div className="no-print" style={{display:'flex',justifyContent:'flex-end',padding:'0 0 16px'}}>
        <button onClick={()=>window.print()} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 20px',background:'var(--white)',border:'1px solid var(--border)',borderRadius:6,fontFamily:'Jost,sans-serif',fontSize:11,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--g500)',cursor:'pointer',transition:'all .2s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--ink)';e.currentTarget.style.color='var(--ink)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--g500)'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Exportar PDF
        </button>
      </div>

      <div id="dashboard-print">

      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{position:'fixed',inset:0,background:'rgba(12,12,12,.96)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out'}}>
          <button onClick={e=>{e.stopPropagation();const prev=(lightbox.index-1+photos.length)%photos.length;setLightbox({...photos[prev],index:prev})}} style={{position:'absolute',left:24,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.1)',border:'none',color:'#fff',fontSize:28,width:48,height:48,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%'}}>‹</button>
          <div onClick={e=>e.stopPropagation()} style={{maxWidth:'85vw',maxHeight:'85vh',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
            <img src={lightbox.url||lightbox.remoteUrl} alt={lightbox.nombre} style={{maxWidth:'100%',maxHeight:'78vh',objectFit:'contain',borderRadius:CARD_RADIUS}}/>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <span style={{fontSize:12,color:'rgba(255,255,255,.5)'}}>{lightbox.nombre}</span>
              {lightbox.fecha && <span style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>{lightbox.fecha}</span>}
              <span style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>{lightbox.index+1} / {photos.length}</span>
            </div>
          </div>
          <button onClick={e=>{e.stopPropagation();const next=(lightbox.index+1)%photos.length;setLightbox({...photos[next],index:next})}} style={{position:'absolute',right:24,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.1)',border:'none',color:'#fff',fontSize:28,width:48,height:48,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%'}}>›</button>
          <button onClick={()=>setLightbox(null)} style={{position:'absolute',top:20,right:20,background:'transparent',border:'none',color:'rgba(255,255,255,.5)',fontSize:20,cursor:'pointer',padding:8}}>✕</button>
        </div>
      )}

      {/* HERO */}
      <div className="section-hero dash-hero">

        <div className="dash-hero-info">
          <div style={{fontSize:10,letterSpacing:'.2em',textTransform:'uppercase',color:'var(--gold)',fontWeight:500,marginBottom:8}}>
            Proyecto activo
          </div>
          <h1 className="section-hero-title" style={{color:'var(--white)',margin:0}}>{p.nombre}</h1>
          <p style={{fontSize:13,color:'rgba(255,255,255,.75)',fontWeight:300,marginTop:4,marginBottom:0}}>
            {p.cliente || p.arquitecto} · {p.ubicacion}
          </p>

          {metaItems.length > 0 && (
            <div className="dash-hero-meta">
              {metaItems.map((item, i) => (
                <span key={item.label} className="dash-hero-meta-item">
                  {i > 0 && <span className="dash-hero-meta-sep">·</span>}
                  <span className="dash-hero-meta-label">{item.label}</span>
                  <span>{item.val}</span>
                </span>
              ))}
            </div>
          )}

          <div style={{marginTop:20,marginBottom:4}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:10,gap:12}}>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontSize:10,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--gold)',fontWeight:500,marginBottom:4}}>
                  {lang==='en' ? 'Current stage' : 'Etapa actual'}
                </div>
                <div style={{fontSize:16,color:'var(--white)',fontWeight:400,overflow:'hidden',textOverflow:'ellipsis'}}>{etapaActual}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:52,fontWeight:300,color:'var(--white)',lineHeight:1}}>{avg}%</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.75)',marginTop:4,fontWeight:300}}>
                  {etapasCompletadas} {lang==='en'?'of':'de'} {stages.length} {lang==='en'?'etapas':'etapas'}
                </div>
              </div>
            </div>
            <div style={{height:10,background:'rgba(255,255,255,.15)',borderRadius:5,overflow:'hidden',marginBottom:14}}>
              <div style={{height:10,background:'linear-gradient(90deg,var(--gold),#e8c27a)',borderRadius:5,width:barW+'%',transition:'width 1.4s ease'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
              <span style={{fontSize:13,color:'rgba(255,255,255,.9)',fontStyle:'italic',fontWeight:300}}>{progressMessage(avg, lang)}</span>
              <span style={{fontSize:11,color:'var(--gold)',letterSpacing:'.1em',textTransform:'uppercase',fontWeight:500}}>
                {lang==='en'?'Delivery:':'Entrega:'} {p.entrega||'Por definir'}
              </span>
            </div>
          </div>
        </div>

        {fotoReciente && (
          <div
            className="dash-hero-image"
            onClick={() => {
              const idx = photos.findIndex(f => (f.url||f.remoteUrl) === (fotoReciente.url||fotoReciente.remoteUrl))
              setLightbox({...fotoReciente, index: idx >= 0 ? idx : 0})
            }}
          >
            <img
              src={fotoReciente.url || fotoReciente.remoteUrl}
              alt={fotoReciente.nombre || 'Foto del proyecto'}
              style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0,transition:'transform .5s ease'}}
              onError={e => { e.target.style.display = 'none' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
            <div style={{
              position:'absolute',
              bottom:0, left:0, right:0,
              background:'linear-gradient(to top, rgba(0,0,0,.8) 0%, rgba(0,0,0,0) 100%)',
              padding:'20px 22px 16px',
              pointerEvents:'none',
            }}>
              <div style={{fontSize:9,letterSpacing:'.22em',textTransform:'uppercase',color:'#ffffff',fontWeight:500,marginBottom:4,opacity:.85}}>
                Última foto de obra
              </div>
              {fotoReciente.fecha && (
                <div style={{fontSize:12,color:'#ffffff',fontWeight:300,letterSpacing:'.02em'}}>
                  {fotoReciente.fecha}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MÉTRICAS */}
      <div className="dash-metrics-grid">
        <div style={metricCard}>
          <div style={metricIconWrap}><IconChart /></div>
          <div style={{minWidth:0,flex:1}}>
            <div style={metricLabel}>{t.av}</div>
            <div style={metricValue}>{avg}%</div>
            <div style={metricSub}>{etapaActual} en curso</div>
          </div>
        </div>

        <div style={metricCard}>
          <div style={metricIconWrap}><IconMoney /></div>
          <div style={{minWidth:0,flex:1}}>
            <div style={metricLabel}>{t.pres}</div>
            <div style={metricValue}>{fmt(presupuesto)}</div>
            <div style={metricSub}>MXN aprobado</div>
          </div>
        </div>

        <div style={metricCard}>
          <div style={metricIconWrap}><IconWallet /></div>
          <div style={{minWidth:0,flex:1}}>
            <div style={metricLabel}>{t.ej}</div>
            <div style={metricValue}>{fmt(totalGastos)}</div>
            <div style={metricSub}>
              {presupuesto>0 ? Math.round(totalGastos/presupuesto*100)+'% del presupuesto' : '—'}
            </div>
          </div>
        </div>

        <div style={metricCard}>
          <div style={metricIconWrap}><IconCalendar /></div>
          <div style={{minWidth:0,flex:1}}>
            <div style={metricLabel}>{t.ent}</div>
            <div style={{...metricValue, fontSize:28}}>{p.entrega||'—'}</div>
            <div style={metricSub}>Siguiente: {siguienteEtapa}</div>
          </div>
        </div>
      </div>

      {/* AVANCE POR ETAPA + BITÁCORA VISUAL */}
      <div className="dash-two-col">
        <div className="card">
          <div className="card-title dash-card-title">
            <span className="dash-card-title-icon"><IconPercent /></span>
            {t.avEtapa}
          </div>
          {stages.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>Sin etapas definidas</p> : (
            <div style={{maxHeight:360, overflowY: stages.length > 7 ? 'auto' : 'visible', paddingRight: stages.length > 7 ? 4 : 0}}>
              {stages.map((e,i)=>{
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
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title dash-card-title">
              <span className="dash-card-title-icon"><IconCamera /></span>
              {t.bitacora}
            </div>
            {photos.length>0 && <span style={{fontSize:12,color:'var(--g400)',fontWeight:300}}>{photos.length} fotos</span>}
          </div>
          {photos.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>{t.noFotos}</p> : (
            <div style={{overflowY:'auto',maxHeight:360,marginTop:4}}>
              <div className="dash-photos-grid">
                {photos.map((f,i)=>(
                  <div key={i} onClick={()=>setLightbox({...f,index:i})} style={{aspectRatio:'1',background:'var(--g100)',overflow:'hidden',position:'relative',cursor:'zoom-in',borderRadius:6}}>
                    <img src={f.url||f.remoteUrl} alt={f.nombre} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .3s'}}
                      onError={e=>e.target.style.display='none'}
                      onMouseEnter={e=>e.target.style.transform='scale(1.06)'}
                      onMouseLeave={e=>e.target.style.transform='scale(1)'}
                    />
                    <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(to top,rgba(12,12,12,.65) 0%,transparent 100%)',padding:'6px 8px'}}>
                      <div style={{fontSize:9,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.nombre}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BITÁCORA */}
      <div className="card">
        <div className="card-title dash-card-title">
          <span className="dash-card-title-icon"><IconNotebook /></span>
          {t.bitacoraNotas}
        </div>
        {posts.length===0 ? <p style={{fontSize:14,color:'var(--g400)',fontWeight:400}}>{t.noNotas}</p> : (
          <div style={{maxHeight:420,overflowY:'auto',paddingRight:4,marginTop:8}}>
            {posts.map((post,i)=>(
              <div key={i} className="dash-log-item">
                <div className="dash-log-accent"/>
                <div className="dash-log-body">
                  <div className="dash-log-date">{post.fecha}</div>
                  <div className="dash-log-text">{post.texto}</div>
                  {post.autor && <div className="dash-log-author">— {post.autor}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>
    </div>
  )
}
