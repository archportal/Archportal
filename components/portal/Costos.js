'use client'
import { useState } from 'react'

function fmt(n) { return '$' + Number(n||0).toLocaleString('es-MX') }

// Convierte fecha "YYYY-MM-DD" (u otros formatos) a timestamp para ordenar.
function fechaTs(f) {
  if (!f) return 0
  const t = new Date(f).getTime()
  return isNaN(t) ? 0 : t
}

// ===== Constantes visuales (mismo lenguaje que Dashboard) =====
const CARD_RADIUS = 12
const INPUT_RADIUS = 6
const BTN_RADIUS = 6

// ===== Íconos SVG dorados =====
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
const IconCheck = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M8 12.5l2.5 2.5L16 9.5"/>
  </svg>
)
const IconClock = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <polyline points="12 7 12 12 15 14"/>
  </svg>
)
const IconPieChart = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12A9 9 0 1 1 12 3v9h9z"/>
    <path d="M21 12A9 9 0 0 0 12 3"/>
  </svg>
)
const IconList = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <circle cx="4" cy="6" r="1.2" fill="currentColor"/>
    <circle cx="4" cy="12" r="1.2" fill="currentColor"/>
    <circle cx="4" cy="18" r="1.2" fill="currentColor"/>
  </svg>
)
const IconEmpty = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20h18"/>
    <rect x="5" y="13" width="3" height="6"/>
    <rect x="10.5" y="9" width="3" height="10"/>
    <rect x="16" y="5" width="3" height="14"/>
  </svg>
)

const printStyles = `
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body * { visibility: hidden !important; }
  #costos-print, #costos-print * { visibility: visible !important; }
  #costos-print { position: absolute; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
  .portal-topbar { display: none !important; }
  @page { margin: 1.5cm; size: A4; }
  /* Al imprimir quitamos el scroll del detalle para que se vea todo */
  .costos-list-scroll { max-height: none !important; overflow: visible !important; }
}
`

const metricsStyles = `
#costos-print .costos-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
@media (max-width: 1024px) {
  #costos-print .costos-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 560px) {
  #costos-print .costos-metrics-grid {
    grid-template-columns: 1fr;
  }
}
`

export default function Costos({ project, user, lang, onRefresh, isArq }) {
  const p = project?.project || project || {}
  const costs = project?.costs || p.costs || []
  const [deleting, setDeleting] = useState(null)
  const [toast, setToast] = useState('')

  const presupuesto = p.presupuesto || 0
  const ejercido    = p.pres_ejercido || 0
  const pagado      = p.pres_pagado || 0
  const totalGastos = costs.reduce((s,c) => s + (parseInt(c.monto)||0), 0)
  const porPagar    = Math.max(0, ejercido - pagado)
  const pendientes  = costs.filter(c=>c.estatus==='Pendiente').length
  const pagadoPct   = presupuesto > 0 ? Math.round(pagado/presupuesto*100) : 0
  const ejercidoPct = presupuesto > 0 ? Math.round(ejercido/presupuesto*100) : 0

  // Indexamos los costos con su posición original ANTES de ordenar
  const costsConIndice = costs.map((c, originalIdx) => ({ ...c, _originalIdx: originalIdx }))
  // Orden: más viejo arriba → más reciente abajo
  const costsOrdenados = [...costsConIndice].sort((a, b) => fechaTs(a.fecha) - fechaTs(b.fecha))

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const deleteCost = async (originalIdx) => {
    if (!confirm('¿Eliminar este gasto?')) return
    setDeleting(originalIdx)
    const newCosts = costs.filter((_, idx) => idx !== originalIdx)
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, costs: newCosts })
      })
      if (res.ok) { showToast('Gasto eliminado'); onRefresh?.() }
      else showToast('Error al eliminar')
    } catch { showToast('Error al eliminar') }
    finally { setDeleting(null) }
  }

  // ===== Estilos métricas (igual que Dashboard) =====
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
    fontSize:28,
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
      <style>{printStyles + metricsStyles + `
        .costos-root .card { border-radius: ${CARD_RADIUS}px !important; overflow: hidden; }
        .costos-root .section-hero { border-radius: ${CARD_RADIUS}px !important; overflow: hidden; }
      `}</style>

      <div className="costos-root">

      {/* Export button */}
      <div className="no-print" style={{display:"flex",justifyContent:"flex-end",padding:"0 0 16px"}}>
        <button onClick={()=>window.print()} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 20px",background:"var(--white)",border:"1px solid var(--border)",borderRadius:BTN_RADIUS,fontFamily:"Jost,sans-serif",fontSize:11,letterSpacing:".08em",textTransform:"uppercase",color:"var(--g500)",cursor:"pointer",transition:"all .2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--ink)";e.currentTarget.style.color="var(--ink)"}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--g500)"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Exportar PDF
        </button>
      </div>

      <div id="costos-print">

      <div className="section-hero" style={{marginBottom:20}}>
        <div className="section-hero-eyebrow" style={{color:'var(--gold)',fontWeight:500}}>Proyecto · Finanzas</div>
        <h1 className="section-hero-title">{isArq ? 'Control de costos' : 'Finanzas del proyecto'}</h1>
        <p className="section-hero-sub">{costs.length} gasto{costs.length!==1?'s':''} registrado{costs.length!==1?'s':''} · {pendientes} pendiente{pendientes!==1?'s':''}</p>
      </div>

      {/* Métricas con íconos dorados */}
      <div className="costos-metrics-grid">
        <div style={metricCard}>
          <div style={metricIconWrap}><IconMoney /></div>
          <div style={{minWidth:0,flex:1}}>
            <div style={metricLabel}>Presupuesto total</div>
            <div style={metricValue}>{fmt(presupuesto)}</div>
            <div style={metricSub}>MXN aprobado</div>
          </div>
        </div>

        <div style={metricCard}>
          <div style={metricIconWrap}><IconWallet /></div>
          <div style={{minWidth:0,flex:1}}>
            <div style={metricLabel}>Gastado hasta hoy</div>
            <div style={metricValue}>{fmt(totalGastos)}</div>
            <div style={metricSub}>{presupuesto>0 ? Math.round(totalGastos/presupuesto*100)+'% del presupuesto' : '—'}</div>
          </div>
        </div>

        <div style={metricCard}>
          <div style={metricIconWrap}><IconCheck /></div>
          <div style={{minWidth:0,flex:1}}>
            <div style={metricLabel}>Ya liquidado</div>
            <div style={metricValue}>{fmt(pagado)}</div>
            <div style={metricSub}>{pagadoPct}% pagado</div>
          </div>
        </div>

        <div style={metricCard}>
          <div style={metricIconWrap}><IconClock /></div>
          <div style={{minWidth:0,flex:1}}>
            <div style={metricLabel}>Por liquidar</div>
            <div style={metricValue}>{fmt(porPagar)}</div>
            <div style={metricSub}>{pendientes} pago{pendientes!==1?'s':''} pendiente{pendientes!==1?'s':''}</div>
          </div>
        </div>
      </div>

      {/* Distribución del presupuesto */}
      <div className="card" style={{marginBottom:16}}>
        <div className="card-title" style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{color:'var(--gold)',display:'inline-flex',flexShrink:0}}><IconPieChart /></span>
          <span>Distribución del presupuesto</span>
        </div>
        <div className="progress-bar-wrap" style={{marginBottom:14, marginTop:4}}>
          <div style={{height:10,background:'linear-gradient(90deg,var(--ink) '+pagadoPct+'%,var(--g300) '+pagadoPct+'% '+(pagadoPct+Math.max(0,ejercidoPct-pagadoPct))+'%,var(--g100) '+(pagadoPct+Math.max(0,ejercidoPct-pagadoPct))+'%)',borderRadius:5,transition:'all .8s ease'}}/>
        </div>
        <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
          {[['var(--ink)','Pagado',pagadoPct+'%'],['var(--g300)','Por pagar',Math.max(0,ejercidoPct-pagadoPct)+'%'],['var(--g100)','Disponible',Math.max(0,100-ejercidoPct)+'%']].map(([color,label,pct])=>(
            <div key={label} style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:10,height:10,background:color,border:color==='var(--g100)'?'1px solid var(--border)':'none',borderRadius:2}}/>
              <span style={{fontSize:12,color:'var(--g500)',fontWeight:300}}>{label} <strong style={{color:'var(--ink)',fontWeight:600}}>{pct}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* Detalle de gastos */}
      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{color:'var(--gold)',display:'inline-flex',flexShrink:0}}><IconList /></span>
            <span>Detalle de gastos</span>
          </div>
          <span style={{fontSize:12,color:'var(--g400)',fontWeight:300}}>{costs.length} registro{costs.length!==1?'s':''} · ordenados por fecha</span>
        </div>

        {costs.length===0 ? (
          <div style={{padding:'48px 0',textAlign:'center'}}>
            <div style={{color:'var(--g300)',marginBottom:14,display:'inline-flex'}}><IconEmpty /></div>
            <p style={{fontSize:15,fontWeight:400,color:'var(--g500)'}}>Sin gastos registrados</p>
          </div>
        ) : (
          <>
            {/* Lista con scroll interno cuando hay más de 10 items */}
            <div
              className="costos-list-scroll"
              style={{
                display:'grid',
                gap:8,
                marginBottom:8,
                maxHeight: 820,
                overflowY: costsOrdenados.length > 10 ? 'auto' : 'visible',
                paddingRight: costsOrdenados.length > 10 ? 6 : 0,
              }}
            >
              {costsOrdenados.map((c)=>(
                <div key={c._originalIdx} style={{background:'var(--off)',border:'1px solid var(--border)',padding:'14px 16px',borderRadius:8,transition:'border-color .2s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--g300)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                  {/* Fila superior: concepto + monto */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8,gap:8}}>
                    <span style={{fontSize:14,fontWeight:500,color:'var(--ink)',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.concepto}</span>
                    <span style={{fontSize:15,fontWeight:600,color:'var(--ink)',flexShrink:0}}>{fmt(c.monto)}</span>
                  </div>
                  {/* Fila inferior: metadata + acciones */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                      <span className={`chip chip-${c.estatus==='Pagado'?'green':c.estatus==='Parcial'?'warn':'red'}`} style={{borderRadius:999}}>{c.estatus==='Pagado'?'✓ Pagado':c.estatus==='Parcial'?'Pago parcial':'Pendiente de pago'}</span>
                      {isArq && c.categoria && <span style={{fontSize:11,color:'var(--g500)',fontWeight:400}}>{c.categoria}</span>}
                      {isArq && c.etapa && <span style={{fontSize:11,color:'var(--g400)'}}>· {c.etapa}</span>}
                      {c.fecha && <span style={{fontSize:11,color:'var(--g400)',fontWeight:300}}>· {c.fecha}</span>}
                    </div>
                    {isArq && (
                      <button onClick={() => deleteCost(c._originalIdx)} disabled={deleting===c._originalIdx}
                        style={{fontSize:11,color:'var(--danger)',background:'transparent',border:'1px solid var(--danger)',padding:'5px 12px',fontFamily:'Jost,sans-serif',cursor:'pointer',opacity:deleting===c._originalIdx?.4:1,flexShrink:0,borderRadius:BTN_RADIUS,transition:'all .15s'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='var(--danger)';e.currentTarget.style.color='#fff'}}
                        onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--danger)'}}>
                        {deleting===c._originalIdx?'...':'✕ Eliminar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer con suma total */}
            <div style={{marginTop:16,background:'var(--ink)',padding:'22px 26px',display:'flex',justifyContent:'space-between',alignItems:'center',borderRadius:CARD_RADIUS,flexWrap:'wrap',gap:12}}>
              <div>
                <div style={{fontSize:9,letterSpacing:'.22em',textTransform:'uppercase',color:'var(--gold)',fontWeight:500,marginBottom:6}}>Suma total</div>
                <div style={{fontSize:13,fontWeight:400,color:'rgba(255,255,255,.85)'}}>Gastos registrados</div>
              </div>
              <div style={{textAlign:'right'}}>
                <span style={{fontFamily:'Cormorant Garamond,serif',fontSize:40,fontWeight:300,color:'var(--white)',lineHeight:1}}>{fmt(totalGastos)}</span>
                <span style={{fontSize:13,color:'rgba(255,255,255,.5)',marginLeft:6}}>MXN</span>
              </div>
            </div>
          </>
        )}
      </div>

      </div>{/* /costos-print */}

      </div>{/* /costos-root */}

      {toast && (
        <div style={{position:'fixed',bottom:32,left:'50%',transform:'translateX(-50%)',background:'var(--ink)',color:'var(--white)',padding:'12px 28px',fontSize:13,fontWeight:300,zIndex:9999,boxShadow:'0 8px 24px rgba(0,0,0,.2)',borderRadius:8}}>
          {toast}
        </div>
      )}
    </div>
  )
}
