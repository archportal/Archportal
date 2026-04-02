'use client'

function fmt(n) { return '$' + Number(n||0).toLocaleString('es-MX') }

export default function Costos({ project, lang }) {
  const p = project?.project || project || {}
  const costs = project?.costs || p.costs || p.costos || []

  const presupuesto = p.presupuesto || 0
  const ejercido    = p.pres_ejercido || 0
  const pagado      = p.pres_pagado || 0
  const porPagar    = Math.max(0, ejercido - pagado)
  const pendientes  = costs.filter(c=>c.estatus==='Pendiente').length
  const pagadoPct   = presupuesto > 0 ? Math.round(pagado/presupuesto*100) : 0
  const ejercidoPct = presupuesto > 0 ? Math.round(ejercido/presupuesto*100) : 0

  const chipStyle = (est) => ({
    fontSize:9, padding:'3px 8px', letterSpacing:'.06em', textTransform:'uppercase',
    background: est==='Pagado'?'#EBF2E4':est==='Parcial'?'#FEF4E4':'#FBE4E4',
    color: est==='Pagado'?'#2D5016':est==='Parcial'?'#7A4A00':'#7A0000'
  })

  return (
    <div>
      {/* Header */}
      <div style={{background:'var(--ink)',padding:'24px 28px',marginBottom:12}}>
        <div style={{fontSize:9,letterSpacing:'.2em',textTransform:'uppercase',color:'rgba(255,255,255,.3)',marginBottom:8}}>Proyecto · Finanzas</div>
        <h1 style={{fontFamily:'Cormorant Garamond, serif',fontSize:28,fontWeight:400,color:'#fff'}}>Control de costos</h1>
      </div>

      {/* Métricas */}
      <div className="metrics-grid" style={{marginBottom:12}}>
        {[
          ['Presupuesto', fmt(presupuesto), 'MXN aprobado'],
          ['Ejercido', fmt(ejercido), ejercidoPct+'% del presupuesto'],
          ['Pagado', fmt(pagado), pagadoPct+'% liquidado'],
          ['Por pagar', fmt(porPagar), pendientes+' pago(s) pendiente(s)'],
        ].map(([label,val,sub])=>(
          <div key={label} className="metric-card">
            <div className="metric-label">{label}</div>
            <div className="metric-value">{val}</div>
            {sub && <div className="metric-sub">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Barra visual */}
      <div className="card" style={{marginBottom:12}}>
        <div className="card-title" style={{marginBottom:12}}>Distribución del presupuesto</div>
        <div style={{height:6,background:'var(--g100)',display:'flex',gap:2,marginBottom:10,overflow:'hidden'}}>
          <div style={{height:6,background:'var(--ink)',width:pagadoPct+'%',transition:'width .8s ease'}}/>
          <div style={{height:6,background:'var(--g300)',width:Math.max(0,ejercidoPct-pagadoPct)+'%',transition:'width .8s ease'}}/>
        </div>
        <div style={{display:'flex',gap:20}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:8,height:8,background:'var(--ink)'}}></div><span style={{fontSize:11,color:'var(--g500)'}}>Pagado {pagadoPct}%</span></div>
          <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:8,height:8,background:'var(--g300)'}}></div><span style={{fontSize:11,color:'var(--g500)'}}>Por pagar {Math.max(0,ejercidoPct-pagadoPct)}%</span></div>
          <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:8,height:8,background:'var(--g100)',border:'1px solid var(--border)'}}></div><span style={{fontSize:11,color:'var(--g500)'}}>Disponible {Math.max(0,100-ejercidoPct)}%</span></div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-title" style={{marginBottom:16}}>Detalle de gastos · {costs.length} registro{costs.length!==1?'s':''}</div>
        {costs.length===0 ? (
          <div style={{padding:'32px 0',textAlign:'center'}}>
            <div style={{fontSize:13,fontWeight:300,color:'var(--g400)'}}>Sin gastos registrados</div>
          </div>
        ) : (
          <>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  {['Concepto','Categoría','Etapa','Monto','Estatus','Fecha'].map(h=>(
                    <th key={h} style={{textAlign:'left',fontSize:9,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--g400)',padding:'0 12px 12px 0',fontWeight:400,borderBottom:'1px solid var(--border)'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {costs.map((c,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid var(--g100)'}}>
                    <td style={{padding:'13px 12px 13px 0',fontSize:13,fontWeight:300,color:'var(--ink)'}}>{c.concepto}</td>
                    <td style={{padding:'13px 12px 13px 0',fontSize:12,color:'var(--g500)'}}>{c.categoria}</td>
                    <td style={{padding:'13px 12px 13px 0',fontSize:12,color:'var(--g500)'}}>{c.etapa||'—'}</td>
                    <td style={{padding:'13px 12px 13px 0',fontSize:13,fontWeight:400,color:'var(--ink)'}}>{fmt(c.monto)}</td>
                    <td style={{padding:'13px 12px 13px 0'}}><span style={chipStyle(c.estatus)}>{c.estatus}</span></td>
                    <td style={{padding:'13px 0',fontSize:12,color:'var(--g400)'}}>{c.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{display:'flex',justifyContent:'space-between',padding:'14px 0 0',borderTop:'1px solid var(--border)',marginTop:4}}>
              <span style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>Total ejercido</span>
              <span style={{fontFamily:'Cormorant Garamond, serif',fontSize:20,fontWeight:300,color:'var(--ink)'}}>{fmt(ejercido)} MXN</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
