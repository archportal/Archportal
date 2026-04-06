'use client'

export default function Cronograma({ project, lang }) {
  const p = project?.project || project || {}
  const stages = project?.stages || p.stages || []

  const completadas = stages.filter(e=>e.estatus==='Completado').length
  const enCurso     = stages.find(e=>e.estatus==='En curso')
  const avg         = stages.length ? Math.round(stages.reduce((s,e)=>s+(e.porcentaje||0),0)/stages.length) : 0

  const statusConfig = {
    'Completado': { chip:'chip-green', dotColor:'var(--success)', barColor:'var(--success)', label:'Completo' },
    'En curso':   { chip:'chip-warn',  dotColor:'var(--gold)',    barColor:'var(--gold)',    label:'En curso' },
    'Pendiente':  { chip:'chip-gray',  dotColor:'var(--g200)',    barColor:'var(--g200)',    label:'Pendiente' },
  }

  return (
    <div>
      <div className="section-hero" style={{marginBottom:20}}>
        <div className="section-hero-eyebrow">Proyecto · Tiempo</div>
        <h1 className="section-hero-title">Cronograma</h1>
        <p className="section-hero-sub">{completadas} de {stages.length} etapas completadas{enCurso ? ' · En curso: '+enCurso.nombre : ''}</p>
        <div style={{marginTop:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <span style={{fontSize:11,color:'rgba(255,255,255,.45)',letterSpacing:'.06em',textTransform:'uppercase'}}>Avance general</span>
            <span style={{fontSize:22,fontFamily:'Cormorant Garamond,serif',color:'var(--white)',fontWeight:300}}>{avg}%</span>
          </div>
          <div style={{height:8,background:'rgba(255,255,255,.12)',borderRadius:4,overflow:'hidden'}}>
            <div style={{height:8,background:'linear-gradient(90deg,var(--gold),#e8c27a)',borderRadius:4,width:avg+'%',transition:'width 1.2s ease'}}/>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Etapas del proyecto</div>
          <span style={{fontSize:12,color:'var(--g400)',fontWeight:300}}>{stages.length} etapa{stages.length!==1?'s':''}</span>
        </div>
        {stages.length===0 ? (
          <div style={{padding:'48px 0',textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:16}}>📅</div>
            <p style={{fontSize:14,fontWeight:300,color:'var(--g400)'}}>Sin etapas definidas aún.</p>
          </div>
        ) : (
          <div>
            {stages.map((e,i)=>{
              const pct = e.porcentaje||0
              const cfg = statusConfig[e.estatus] || statusConfig['Pendiente']
              const isActive = e.estatus==='En curso'
              return (
                <div key={i} style={{padding:'16px 0',borderBottom:'1px solid var(--g100)',borderLeft:isActive?'3px solid var(--gold)':'3px solid transparent',paddingLeft:isActive?'14px':'3px',transition:'all .2s',background:isActive?'rgba(200,169,110,.04)':'transparent'}}>
                  {/* Fila superior: número + nombre + chip */}
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                    <div style={{width:36,height:36,borderRadius:'50%',border:'2px solid',borderColor:pct===100?'var(--success)':isActive?'var(--gold)':'var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:pct===100?'var(--success)':isActive?'var(--gold)':'var(--g400)',flexShrink:0,background:pct===100?'var(--success-bg)':'var(--white)'}}>
                      {pct===100?'✓':String(i+1).padStart(2,'0')}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:isActive?500:400,color:'var(--ink)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombre}</div>
                      <div style={{fontSize:11,color:'var(--g400)',marginTop:2}}>{e.fechas||'Por definir'}</div>
                    </div>
                    <span className={`chip ${cfg.chip}`} style={{flexShrink:0}}>{cfg.label}</span>
                  </div>
                  {/* Fila inferior: barra + porcentaje */}
                  <div style={{display:'flex',alignItems:'center',gap:10,paddingLeft:48}}>
                    <div style={{flex:1}}>
                      <div className="progress-bar-wrap" style={{height:6}}>
                        <div style={{height:6,borderRadius:3,background:cfg.barColor,width:pct+'%',transition:'width .8s ease'}}/>
                      </div>
                    </div>
                    <span style={{fontSize:13,fontWeight:600,color:'var(--ink)',width:36,textAlign:'right',flexShrink:0}}>{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
