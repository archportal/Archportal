'use client'
import { useState } from 'react'

function fmt(n) { return '$' + Number(n||0).toLocaleString('es-MX') }

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

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const deleteCost = async (i) => {
    if (!confirm('¿Eliminar este gasto?')) return
    setDeleting(i)
    const newCosts = costs.filter((_, idx) => idx !== i)
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

  return (
    <div>
      <div className="section-hero" style={{marginBottom:20}}>
        <div className="section-hero-eyebrow">Proyecto · Finanzas</div>
        <h1 className="section-hero-title">Control de costos</h1>
        <p className="section-hero-sub">{costs.length} gasto{costs.length!==1?'s':''} registrado{costs.length!==1?'s':''} · {pendientes} pendiente{pendientes!==1?'s':''}</p>
      </div>

      <div className="metrics-grid" style={{marginBottom:20}}>
        {[
          {label:'Presupuesto', val:fmt(presupuesto), sub:'MXN aprobado'},
          {label:'Ejercido', val:fmt(ejercido), sub:ejercidoPct+'% del presupuesto'},
          {label:'Pagado', val:fmt(pagado), sub:pagadoPct+'% liquidado'},
          {label:'Por pagar', val:fmt(porPagar), sub:pendientes+' pago(s) pendiente(s)', accent:porPagar>0},
        ].map(({label,val,sub,accent})=>(
          <div key={label} className={`metric-card${accent?' accent':''}`}>
            <div className="metric-label">{label}</div>
            <div className="metric-value">{val}</div>
            <div className="metric-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginBottom:16}}>
        <div className="card-title">Distribución del presupuesto</div>
        <div className="progress-bar-wrap" style={{marginBottom:12}}>
          <div style={{height:8,background:'linear-gradient(90deg,var(--ink) '+pagadoPct+'%,var(--g300) '+pagadoPct+'% '+(pagadoPct+Math.max(0,ejercidoPct-pagadoPct))+'%,var(--g100) '+(pagadoPct+Math.max(0,ejercidoPct-pagadoPct))+'%)',borderRadius:4,transition:'all .8s ease'}}/>
        </div>
        <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
          {[['var(--ink)','Pagado',pagadoPct+'%'],['var(--g300)','Por pagar',Math.max(0,ejercidoPct-pagadoPct)+'%'],['var(--g100)','Disponible',Math.max(0,100-ejercidoPct)+'%']].map(([color,label,pct])=>(
            <div key={label} style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:10,height:10,background:color,border:color==='var(--g100)'?'1px solid var(--border)':'none',borderRadius:2}}/>
              <span style={{fontSize:12,color:'var(--g500)',fontWeight:300}}>{label} <strong style={{color:'var(--ink)',fontWeight:500}}>{pct}</strong></span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Detalle de gastos</div>
          <span style={{fontSize:12,color:'var(--g400)',fontWeight:300}}>{costs.length} registro{costs.length!==1?'s':''}</span>
        </div>
        {costs.length===0 ? (
          <div style={{padding:'40px 0',textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:12}}>📊</div>
            <p style={{fontSize:14,fontWeight:300,color:'var(--g400)'}}>Sin gastos registrados</p>
          </div>
        ) : (
          <>
            <div style={{display:'grid',gap:8,marginBottom:8}}>
              {costs.map((c,i)=>(
                <div key={i} style={{background:'var(--off)',border:'1px solid var(--border)',padding:'14px 16px'}}>
                  {/* Fila superior: concepto + monto */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8,gap:8}}>
                    <span style={{fontSize:14,fontWeight:500,color:'var(--ink)',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.concepto}</span>
                    <span style={{fontSize:15,fontWeight:600,color:'var(--ink)',flexShrink:0}}>{fmt(c.monto)}</span>
                  </div>
                  {/* Fila inferior: metadata + acciones */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                      <span className={`chip chip-${c.estatus==='Pagado'?'green':c.estatus==='Parcial'?'warn':'red'}`}>{c.estatus}</span>
                      <span style={{fontSize:11,color:'var(--g400)'}}>{c.categoria}</span>
                      {c.etapa && <span style={{fontSize:11,color:'var(--g400)'}}>{c.etapa}</span>}
                      {c.fecha && <span style={{fontSize:11,color:'var(--g300)'}}>{c.fecha}</span>}
                    </div>
                    {isArq && (
                      <button onClick={() => deleteCost(i)} disabled={deleting===i}
                        style={{fontSize:11,color:'var(--danger)',background:'transparent',border:'1px solid var(--danger)',padding:'5px 12px',fontFamily:'Jost,sans-serif',cursor:'pointer',opacity:deleting===i?.4:1,flexShrink:0}}
                        onMouseEnter={e=>{e.currentTarget.style.background='var(--danger)';e.currentTarget.style.color='#fff'}}
                        onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--danger)'}}>
                        {deleting===i?'...':'✕ Eliminar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 0 0',borderTop:'2px solid var(--border)',marginTop:8}}>
              <span style={{fontSize:13,fontWeight:500,color:'var(--ink)',letterSpacing:'.04em'}}>Total de gastos registrados</span>
              <span style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:300,color:'var(--ink)'}}>{fmt(totalGastos)} <span style={{fontSize:14,color:'var(--g400)'}}>MXN</span></span>
            </div>
          </>
        )}
      </div>

      {toast && <div style={{position:'fixed',bottom:32,left:'50%',transform:'translateX(-50%)',background:'var(--ink)',color:'var(--white)',padding:'12px 28px',fontSize:13,fontWeight:300,zIndex:9999,boxShadow:'0 8px 24px rgba(0,0,0,.2)'}}>{toast}</div>}
    </div>
  )
}
