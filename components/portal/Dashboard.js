'use client'

const fmt = n => '$' + Number(n||0).toLocaleString('es-MX')

export default function Dashboard({ project, user, lang }) {
  // project comes as { project:{...}, stages:[...], costs:[...], posts:[...], photos:[...], files:[...], questions:[...] }
  // or could be just the project object if freshly created
  const data = project || {}
  const p = data.project || data || {}
  const stages   = data.stages   || []
  const costs    = data.costs    || []
  const posts    = data.posts    || []
  const photos   = data.photos   || []
  const files    = data.files    || []

  // Parse JSON fields stored as strings
  const parseJson = (v) => { try { return typeof v==='string'?JSON.parse(v):(Array.isArray(v)?v:[]) } catch { return [] } }
  const notes = parseJson(p.notes)

  const avg = stages.length ? Math.round(stages.reduce((s,e)=>s+(e.porcentaje||0),0)/stages.length) : 0
  const presupuesto = p.presupuesto || 0
  const ejercido    = p.pres_ejercido || 0
  const pagado      = p.pres_pagado || 0
  const porPagar    = Math.max(0, ejercido - pagado)

  const etapaActual   = stages.find(e=>e.estatus==='En curso')?.nombre || p.etapa_actual || 'Por iniciar'
  const siguienteEtapa = stages.find(e=>e.estatus==='Pendiente')?.nombre || '—'

  const t = lang==='en'
    ? {av:'Overall progress',pres:'Budget',ej:'Spent',pp:'To pay',ent:'Delivery',avEtapa:'Progress by stage',bitacora:'Visual log',archRec:'Recent files',cosRec:'Recent costs',info:'Project info',notas:'Resident log',notasCli:'Architect notes',noFotos:'No photos yet',noArch:'No files yet',noCostos:'No expenses yet',noNotas:'No notes published.',noNotasCli:'No notes yet.'}
    : {av:'Avance general',pres:'Presupuesto',ej:'Ejercido',pp:'Por pagar',ent:'Entrega estimada',avEtapa:'Avance por etapa',bitacora:'Bitácora visual',archRec:'Archivos recientes',cosRec:'Costos recientes',info:'Información del proyecto',notas:'Bitácora del residente',notasCli:'Notas del arquitecto',noFotos:'Sin fotos aún',noArch:'Sin archivos aún',noCostos:'Sin gastos aún',noNotas:'Sin notas publicadas.',noNotasCli:'Sin notas del arquitecto.'}

  if (!p.id) return <div style={{padding:48,color:'var(--g400)',fontWeight:300,fontSize:14}}>Cargando proyecto...</div>

  return (
    <div style={{maxWidth:1100,margin:'0 auto',padding:'0 32px'}}>
      <div style={{paddingBottom:24,borderBottom:'1px solid var(--border)',marginBottom:24}}>
        <h1 style={{fontFamily:'Cormorant Garamond, serif',fontSize:36,fontWeight:300,color:'var(--ink)',marginBottom:4}}>{p.nombre}</h1>
        <p style={{fontSize:13,fontWeight:300,color:'var(--g400)'}}>{p.ubicacion} · Actualizado hoy</p>
      </div>

      {/* 4 metrics */}
      <div className="metrics-grid" style={{marginBottom:24}}>
        {[
          [t.av, avg+'%', etapaActual+' en curso'],
          [t.pres, fmt(presupuesto), 'MXN aprobado'],
          [t.ej, fmt(ejercido), presupuesto>0?Math.round(ejercido/presupuesto*100)+'% del total':'0%'],
          [t.ent, p.entrega||'Por definir', 'Siguiente: '+siguienteEtapa],
        ].map(([label,val,sub])=>(
          <div key={label} className="metric-card">
            <div className="metric-label">{label}</div>
            <div className="metric-value" style={{fontSize:label===t.ent?24:undefined}}>{val}</div>
            <div className="metric-sub">{sub}</div>
          </div>
        ))}
      </div>



      <div className="two-col">
        {/* Avance por etapa */}
        <div className="card">
          <div className="card-title">{t.avEtapa}</div>
          {stages.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>Sin etapas definidas</p> : (
            stages.map((e,i)=>{
              const pct=e.porcentaje||0
              const color=pct===100?'#2D5016':pct>50?'#C8860A':pct>0?'var(--ink)':'var(--g200)'
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:color,flexShrink:0}}/>
                  <span style={{fontSize:13,fontWeight:300,color:'var(--g600)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombre}</span>
                  <div style={{flex:2,height:1,background:'var(--border)',position:'relative',minWidth:60}}>
                    <div style={{position:'absolute',top:0,left:0,height:1,background:color,width:pct+'%',transition:'width .6s'}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:400,color:'var(--g400)',width:36,textAlign:'right'}}>{pct}%</span>
                </div>
              )
            })
          )}
        </div>

        {/* Bitácora visual */}
        <div className="card">
          <div className="card-title">{t.bitacora}</div>
          {photos.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>{t.noFotos}</p> : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4}}>
              {photos.slice(0,6).map((f,i)=>(
                <div key={i} style={{aspectRatio:'1',background:'var(--g100)',overflow:'hidden',position:'relative'}}>
                  <img src={f.url||f.remoteUrl} alt={f.nombre} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                  <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(12,12,12,.5)',padding:'4px 6px',fontSize:10,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.nombre}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="three-col" style={{marginTop:16}}>
        {/* Archivos recientes */}
        <div className="card">
          <div className="card-title">{t.archRec}</div>
          {files.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>{t.noArch}</p> : (
            files.slice(0,4).map((f,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{width:32,height:32,background:f.tipo==='PDF'?'#FBE4E4':'#E4EBF8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:600,color:f.tipo==='PDF'?'#8B1A1A':'#1A3A8B',flexShrink:0}}>{f.tipo||'FILE'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:300,color:'var(--ink)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.nombre}</div>
                  <div style={{fontSize:11,color:'var(--g400)'}}>{f.fecha}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Costos recientes */}
        <div className="card">
          <div className="card-title">{t.cosRec}</div>
          {costs.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>{t.noCostos}</p> : (
            costs.slice(0,4).map((c,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',gap:8}}>
                <span style={{fontSize:13,fontWeight:300,color:'var(--ink)',minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.concepto}</span>
                <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                  <span style={{fontSize:12,fontWeight:400,color:'var(--ink)'}}>{fmt(c.monto)}</span>
                  <span style={{fontSize:9,padding:'2px 6px',background:c.estatus==='Pagado'?'#EBF2E4':c.estatus==='Parcial'?'#FEF4E4':'#FBE4E4',color:c.estatus==='Pagado'?'#2D5016':c.estatus==='Parcial'?'#7A4A00':'#7A0000'}}>{c.estatus}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info proyecto */}
        <div className="card">
          <div className="card-title">{t.info}</div>
          {[['Proyecto',p.nombre],['Ubicación',p.ubicacion],['Superficie',p.superficie?p.superficie+' m²':null],['Niveles',p.niveles],['Arquitecto',p.arquitecto],['Inicio',p.inicio]].map(([label,val])=>val?(
            <div key={label} style={{marginBottom:12}}>
              <div style={{fontSize:9,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--g400)',marginBottom:2}}>{label}</div>
              <div style={{fontSize:13,fontWeight:300,color:'var(--ink)'}}>{val}</div>
            </div>
          ):null)}
        </div>
      </div>

      {/* Notas */}
      <div className="two-col" style={{marginTop:16}}>
        <div className="card">
          <div className="card-title">{t.notas}</div>
          {posts.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>{t.noNotas}</p> : (
            posts.slice(0,3).map((post,i)=>(
              <div key={i} style={{padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--g400)',marginBottom:4}}>{post.fecha}</div>
                <div style={{fontSize:13,fontWeight:300,color:'var(--ink)',lineHeight:1.7}}>{post.texto}</div>
              </div>
            ))
          )}
        </div>
        <div className="card">
          <div className="card-title">{t.notasCli}</div>
          {notes.length===0 ? <p style={{fontSize:13,color:'var(--g400)',fontWeight:300}}>{t.noNotasCli}</p> : (
            notes.slice(0,3).map((nota,i)=>(
              <div key={i} style={{padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--g400)',marginBottom:4}}>{nota.fecha}</div>
                <div style={{fontSize:13,fontWeight:300,color:'var(--ink)',lineHeight:1.7}}>{nota.texto}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
