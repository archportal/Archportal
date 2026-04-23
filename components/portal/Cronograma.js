'use client'

const CARD_RADIUS = 12
const BTN_RADIUS = 6

// Ícono dorado para título de sección
const IconTimeline = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="4" x2="12" y2="20"/>
    <circle cx="12" cy="6.5" r="2" fill="currentColor"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <circle cx="12" cy="17.5" r="2"/>
  </svg>
)

// Ícono para estado vacío
const IconCalendarEmpty = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18"/>
    <path d="M8 3v4M16 3v4"/>
  </svg>
)

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
      <style>{`
        .crono-root .card { border-radius: ${CARD_RADIUS}px !important; overflow: hidden; }
        .crono-root .section-hero { border-radius: ${CARD_RADIUS}px !important; overflow: hidden; }
        .crono-root .chip { border-radius: 999px !important; }
      `}</style>

      <div className="crono-root">

      <div className="section-hero" style={{marginBottom:20}}>
        <div className="section-hero-eyebrow" style={{color:'var(--gold)',fontWeight:500}}>Proyecto · Tiempo</div>
        <h1 className="section-hero-title">Cronograma</h1>
        <p className="section-hero-sub">
          {completadas} de {stages.length} etapas completadas{enCurso ? ' · En curso: '+enCurso.nombre : ''}
        </p>

        {avg >= 50 && avg < 100 && (
          <div style={{marginTop:12,display:'inline-flex',alignItems:'center',gap:8,background:'rgba(200,169,110,.15)',border:'1px solid rgba(200,169,110,.3)',padding:'6px 16px',borderRadius:999}}>
            <span style={{fontSize:20}}>🎉</span>
            <span style={{fontSize:12,color:'var(--gold)',fontWeight:500,letterSpacing:'.02em'}}>¡Ya vas a más de la mitad! Sigue así.</span>
          </div>
        )}
        {avg === 100 && (
          <div style={{marginTop:12,display:'inline-flex',alignItems:'center',gap:8,background:'rgba(45,80,22,.15)',border:'1px solid rgba(45,80,22,.3)',padding:'6px 16px',borderRadius:999}}>
            <span style={{fontSize:20}}>✅</span>
            <span style={{fontSize:12,color:'#7bc55a',fontWeight:500}}>¡Proyecto completado!</span>
          </div>
        )}

        <div style={{marginTop:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontSize:10,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--gold)',fontWeight:500}}>Avance general</span>
            <span style={{fontSize:28,fontFamily:'Cormorant Garamond,serif',color:'var(--white)',fontWeight:300,lineHeight:1}}>{avg}%</span>
          </div>
          <div style={{height:10,background:'rgba(255,255,255,.15)',borderRadius:5,overflow:'hidden'}}>
            <div style={{height:10,background:'linear-gradient(90deg,var(--gold),#e8c27a)',borderRadius:5,width:avg+'%',transition:'width 1.2s ease'}}/>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{color:'var(--gold)',display:'inline-flex',flexShrink:0}}><IconTimeline /></span>
            <span>Etapas del proyecto</span>
          </div>
          <span style={{fontSize:12,color:'var(--g400)',fontWeight:300}}>{stages.length} etapa{stages.length!==1?'s':''}</span>
        </div>

        {stages.length===0 ? (
          <div style={{padding:'56px 0',textAlign:'center'}}>
            <div style={{color:'var(--g300)',marginBottom:14,display:'inline-flex'}}><IconCalendarEmpty /></div>
            <p style={{fontSize:15,fontWeight:400,color:'var(--g500)',marginBottom:6}}>Sin etapas definidas aún</p>
            <p style={{fontSize:12,color:'var(--g400)',fontWeight:300}}>El arquitecto configurará el cronograma pronto.</p>
          </div>
        ) : (
          <div
            style={{
              maxHeight: stages.length > 10 ? 820 : 'none',
              overflowY: stages.length > 10 ? 'auto' : 'visible',
              paddingRight: stages.length > 10 ? 6 : 0,
            }}
          >
            {stages.map((e,i)=>{
              const pct = e.porcentaje||0
              const cfg = statusConfig[e.estatus] || statusConfig['Pendiente']
              const isActive = e.estatus==='En curso'
              return (
                <div key={i} style={{
                  padding:'16px 0',
                  borderBottom: i === stages.length - 1 ? 'none' : '1px solid var(--g100)',
                  borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                  paddingLeft: isActive ? 14 : 3,
                  transition:'all .2s',
                  background: isActive ? 'rgba(200,169,110,.04)' : 'transparent',
                  borderRadius: isActive ? 4 : 0,
                }}>
                  {/* Fila superior: número + nombre + chip */}
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                    <div style={{
                      width:38,
                      height:38,
                      borderRadius:'50%',
                      border:'2px solid',
                      borderColor: pct===100 ? 'var(--success)' : isActive ? 'var(--gold)' : 'var(--border)',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      fontSize:11,
                      fontWeight:600,
                      color: pct===100 ? 'var(--success)' : isActive ? 'var(--gold)' : 'var(--g400)',
                      flexShrink:0,
                      background: pct===100 ? 'var(--success-bg)' : 'var(--white)',
                    }}>
                      {pct===100?'✓':String(i+1).padStart(2,'0')}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:isActive?500:400,color:'var(--ink)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombre}</div>
                      <div style={{fontSize:11,color:'var(--g400)',marginTop:3,fontWeight:300}}>{e.fechas||'Por definir'}</div>
                    </div>
                    <span className={`chip ${cfg.chip}`} style={{flexShrink:0, borderRadius:999}}>{cfg.label}</span>
                  </div>
                  {/* Fila inferior: barra + porcentaje */}
                  <div style={{display:'flex',alignItems:'center',gap:10,paddingLeft:50}}>
                    <div style={{flex:1}}>
                      <div className="progress-bar-wrap" style={{height:6}}>
                        <div style={{height:6,borderRadius:3,background:cfg.barColor,width:pct+'%',transition:'width .8s ease'}}/>
                      </div>
                    </div>
                    <span style={{fontSize:13,fontWeight:600,color:'var(--ink)',width:42,textAlign:'right',flexShrink:0}}>{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      </div>
    </div>
  )
}
