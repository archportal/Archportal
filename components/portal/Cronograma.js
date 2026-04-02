'use client'

export default function Cronograma({ project, lang }) {
  const p = project?.project || project || {}
  const stages = project?.stages || p.stages || p.etapas || []

  const completadas = stages.filter(e=>e.estatus==='Completado').length
  const enCurso     = stages.find(e=>e.estatus==='En curso')
  const avg         = stages.length ? Math.round(stages.reduce((s,e)=>s+(e.porcentaje||0),0)/stages.length) : 0

  const statusStyle = {
    'Completado': { bg:'#EBF2E4', color:'#2D5016' },
    'En curso':   { bg:'#FEF4E4', color:'#7A4A00' },
    'Pendiente':  { bg:'#F0EFEC', color:'#6B6A62' },
  }

  return (
    <div>
      {/* Header */}
      <div style={{background:'var(--ink)',padding:'24px 28px',marginBottom:12}}>
        <div style={{fontSize:9,letterSpacing:'.2em',textTransform:'uppercase',color:'rgba(255,255,255,.3)',marginBottom:8}}>Proyecto · Tiempo</div>
        <h1 style={{fontFamily:'Cormorant Garamond, serif',fontSize:28,fontWeight:400,color:'#fff',marginBottom:16}}>Cronograma</h1>
        <div style={{height:2,background:'rgba(255,255,255,.12)',marginBottom:8,position:'relative'}}>
          <div style={{position:'absolute',top:0,left:0,height:2,background:'#fff',width:avg+'%',transition:'width .8s ease'}}/>
          <div style={{position:'absolute',right:0,top:-18,fontSize:11,color:'#fff',fontWeight:500}}>{avg}%</div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'rgba(255,255,255,.35)',letterSpacing:'.08em',textTransform:'uppercase'}}>
          <span>{completadas} de {stages.length} etapas completadas</span>
          <span>{enCurso ? 'En curso: '+enCurso.nombre : 'Sin etapa activa'}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{marginBottom:16}}>Etapas del proyecto</div>
        {stages.length===0 ? (
          <div style={{padding:'32px 0',textAlign:'center'}}>
            <div style={{fontSize:13,fontWeight:300,color:'var(--g400)'}}>Sin etapas definidas aún.</div>
          </div>
        ) : (
          stages.map((e,i)=>{
            const pct = e.porcentaje||e.pct||0
            const sc  = statusStyle[e.estatus]||statusStyle['Pendiente']
            const isActive = e.estatus==='En curso'
            return (
              <div key={i} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 0',borderBottom:'1px solid var(--g100)',borderLeft:isActive?'3px solid var(--ink)':'3px solid transparent',paddingLeft:isActive?'16px':'0',transition:'all .2s'}}>
                {/* Número */}
                <div style={{width:36,height:36,borderRadius:'50%',border:'1px solid',borderColor:pct===100?'#2D5016':isActive?'var(--ink)':'var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:500,color:pct===100?'#2D5016':isActive?'var(--ink)':'var(--g400)',flexShrink:0,background:pct===100?'#EBF2E4':'var(--white)'}}>
                  {pct===100?'✓':String(i+1).padStart(2,'0')}
                </div>
                {/* Info */}
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:pct>0?400:300,color:'var(--ink)',marginBottom:3}}>{e.nombre}</div>
                  <div style={{fontSize:11,color:'var(--g400)'}}>{e.fechas||'Por definir'}</div>
                </div>
                {/* Barra + % + chip */}
                <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
                  <div style={{width:100,height:2,background:'var(--g100)',position:'relative'}}>
                    <div style={{position:'absolute',top:0,left:0,height:2,background:pct===100?'#2D5016':pct>0?'var(--ink)':'transparent',width:pct+'%',transition:'width .8s'}}/>
                  </div>
                  <span style={{fontSize:12,color:'var(--g400)',width:32,textAlign:'right'}}>{pct}%</span>
                  <span style={{fontSize:9,padding:'3px 10px',background:sc.bg,color:sc.color,letterSpacing:'.08em',textTransform:'uppercase',minWidth:72,textAlign:'center'}}>{e.estatus||'Pendiente'}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
