'use client'
import { useState } from 'react'
import { sendBitacoraEmail, sendNotaArqEmail, sendClientAccessEmail } from '@/lib/emailjs'

// Extract text from PDF in the browser using pdfjs-dist
async function extractPdfTextClient(file) {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
    let fullText = ''
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      fullText += content.items.map(item => item.str).join(' ') + '\n'
    }
    return fullText.trim().substring(0, 3000)
  } catch (e) {
    console.warn('PDF client extraction error:', e.message)
    return null
  }
}

async function uploadFile(file, projectId, bucket) {
  if (!file) return null
  const formData = new FormData()
  formData.append('file', file)
  formData.append('projectId', projectId)
  formData.append('bucket', bucket)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  const data = await res.json()
  if (!res.ok) { console.warn('Upload error:', data.error); return null }
  return data
}

export default function Admin({ project, user, onRefresh }) {
  const p = project?.project || project || {}
  const stagesDB  = project?.stages   || []
  const costsDB   = project?.costs    || []
  const postsDB   = project?.posts    || []
  const photosDB  = project?.photos   || []
  const filesDB   = project?.files    || []

  const parseJson = (v) => { try { return typeof v === 'string' ? JSON.parse(v) : (Array.isArray(v) ? v : []) } catch { return [] } }
  const notesDB = parseJson(p.notes)
  const kbDB    = parseJson(p.knowledge_base)

  const [info, setInfo] = useState({ nombre:p.nombre||'', cliente:p.cliente||'', ubicacion:p.ubicacion||'', arquitecto:p.arquitecto||'', superficie:p.superficie||'', niveles:p.niveles||'', inicio:p.inicio||'', entrega:p.entrega||'', etapa_actual:p.etapa_actual||'' })
  const [pres, setPres] = useState({ aprobado:p.presupuesto||'', ejercido:p.pres_ejercido||'', pagado:p.pres_pagado||'' })
  const [etapas, setEtapas] = useState(stagesDB.length ? stagesDB.map(s=>({nombre:s.nombre||'',fechas:s.fechas||'Por definir',estatus:s.estatus||'Pendiente',porcentaje:s.porcentaje||0})) : [{nombre:'Proyecto arquitectonico',fechas:'Por definir',estatus:'Pendiente',porcentaje:0}])
  const [costoForm, setCostoForm] = useState({concepto:'',categoria:'Material',etapa:'',monto:'',estatus:'Pendiente',fecha:''})
  const [archivoForm, setArchivoForm] = useState({nombre:'',tipo:'PDF',etapa:'',fecha:''})
  const [archivoFile, setArchivoFile] = useState(null)
  const [fotoFiles, setFotoFiles] = useState([])
  const [postText, setPostText] = useState('')
  const [notaText, setNotaText] = useState('')
  const [clientEmail, setClientEmail] = useState(p.client_email||'')
  const [clientPass, setClientPass] = useState(p.client_pass||'')
  const [kbTema, setKbTema] = useState('')
  const [kbInfo, setKbInfo] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 3000) }

  const api = async (body) => {
    setSaving(true)
    try {
      const res = await fetch('/api/projects', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:p.id,...body}) })
      const data = await res.json()
      if (!res.ok) { showToast('Error: '+(data.error||'desconocido')); return false }
      await onRefresh?.()
      return true
    } catch(e) { showToast('Error al guardar'); return false }
    finally { setSaving(false) }
  }

  const porPagar = Math.max(0,(parseInt(pres.ejercido)||0)-(parseInt(pres.pagado)||0))

  return (
    <div>
      <div style={{background:'var(--ink)',padding:'24px 28px',marginBottom:12}}>
        <div style={{fontSize:9,letterSpacing:'.2em',textTransform:'uppercase',color:'rgba(255,255,255,.3)',marginBottom:8}}>Modo edición activo</div>
        <h1 style={{fontFamily:'Cormorant Garamond, serif',fontSize:28,fontWeight:400,color:'#fff',marginBottom:4}}>Panel de administración</h1>
        <p style={{fontSize:12,color:'rgba(255,255,255,.4)',margin:0}}>Los cambios se reflejan de inmediato al cliente</p>
      </div>

      <div className="two-col">
        {/* LEFT */}
        <div>
          {/* Info */}
          <div className="card">
            <div className="card-title">Información general del proyecto</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 24px'}}>
              {[['nombre','Nombre'],['cliente','Cliente'],['ubicacion','Ubicacion'],['arquitecto','Arquitecto'],['superficie','Superficie m²'],['niveles','Niveles'],['inicio','Fecha inicio'],['entrega','Entrega estimada'],['etapa_actual','Etapa actual']].map(([k,label])=>(
                <div key={k} className="form-field">
                  <label className="form-label">{label}</label>
                  <input className="form-input" value={info[k]} onChange={e=>setInfo(i=>({...i,[k]:e.target.value}))}/>
                </div>
              ))}
            </div>
            <button className="btn-submit" style={{maxWidth:220,marginTop:8}} onClick={()=>api(info).then(ok=>ok&&showToast('Información guardada'))} disabled={saving}>Guardar información</button>
          </div>

          {/* Etapas */}
          <div className="card" style={{marginTop:16}}>
            <div className="card-title">Avance por etapa (%)</div>
            <p style={{fontSize:12,fontWeight:300,color:'var(--g400)',marginBottom:16}}>Mueve el slider para actualizar el porcentaje.</p>
            <div style={{overflowY:'scroll',maxHeight:340,marginBottom:10}}>
            {etapas.map((e,i)=>(
              <div key={i} style={{background:'var(--paper)',padding:12,marginBottom:10}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:10,marginBottom:10}}>
                  <div className="form-field" style={{marginBottom:0}}>
                    <label className="form-label">Nombre de etapa</label>
                    <input className="form-input" value={e.nombre} onChange={ev=>setEtapas(prev=>prev.map((x,idx)=>idx===i?{...x,nombre:ev.target.value}:x))}/>
                  </div>
                  <div className="form-field" style={{marginBottom:0}}>
                    <label className="form-label">Periodo / Fechas</label>
                    <input className="form-input" value={e.fechas} onChange={ev=>setEtapas(prev=>prev.map((x,idx)=>idx===i?{...x,fechas:ev.target.value}:x))}/>
                  </div>
                  <div className="form-field" style={{marginBottom:0}}>
                    <label className="form-label">Estatus</label>
                    <select className="form-input" style={{cursor:'pointer'}} value={e.estatus} onChange={ev=>setEtapas(prev=>prev.map((x,idx)=>idx===i?{...x,estatus:ev.target.value}:x))}>
                      {['Pendiente','En curso','Completado'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:12,color:'var(--g500)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombre||'Etapa'}</span>
                  <input type="range" min="0" max="100" value={e.porcentaje} onChange={ev=>setEtapas(prev=>prev.map((x,idx)=>idx===i?{...x,porcentaje:parseInt(ev.target.value)}:x))} style={{flex:2,accentColor:'var(--ink)'}}/>
                  <span style={{fontSize:13,fontWeight:500,color:'var(--ink)',minWidth:36,textAlign:'right'}}>{e.porcentaje}%</span>
                  <button onClick={()=>setEtapas(prev=>prev.filter((_,idx)=>idx!==i))} style={{background:'#B83232',color:'#fff',border:'none',width:24,height:24,cursor:'pointer',fontSize:12,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                </div>
              </div>
            ))}
            </div>
            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button onClick={()=>setEtapas(prev=>[...prev,{nombre:'',fechas:'Por definir',estatus:'Pendiente',porcentaje:0}])} style={{padding:'10px 20px',background:'transparent',border:'1px solid var(--border)',fontFamily:'Jost,sans-serif',fontSize:11,color:'var(--g500)',cursor:'pointer',letterSpacing:'.08em',textTransform:'uppercase'}}>+ Agregar etapa</button>
              <button className="btn-submit" style={{maxWidth:200,marginTop:0}} onClick={()=>api({stages:etapas}).then(ok=>ok&&showToast('Cronograma guardado'))} disabled={saving}>Guardar avances</button>
            </div>
          </div>

          {/* Acceso cliente */}
          <div className="card" style={{marginTop:16}}>
            <div className="card-title">Acceso del cliente</div>
            <p style={{fontSize:12,fontWeight:300,color:'var(--g400)',marginBottom:16,lineHeight:1.7}}>Define las credenciales para que tu cliente entre a ver este proyecto.</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 24px'}}>
              <div className="form-field"><label className="form-label">Email del cliente</label><input className="form-input" type="email" placeholder="cliente@email.com" value={clientEmail} onChange={e=>setClientEmail(e.target.value)}/></div>
              <div className="form-field"><label className="form-label">Contraseña</label><input className="form-input" placeholder="Contraseña para el cliente" value={clientPass} onChange={e=>setClientPass(e.target.value)}/></div>
            </div>
            <button className="btn-submit" style={{maxWidth:200}} onClick={async()=>{
              const ok = await api({client_email:clientEmail, client_pass:clientPass})
              if(ok) {
                showToast('Acceso guardado')
                sendClientAccessEmail({
                  nombreCliente:    p.cliente,
                  emailCliente:     clientEmail,
                  passwordCliente:  clientPass,
                  proyecto:         p.nombre,
                  nombreArquitecto: user.name || user.email,
                  emailArquitecto:  user.email
                })
              }
            }} disabled={saving}>Guardar acceso</button>
          </div>

          {/* Presupuesto */}
          <div className="card" style={{marginTop:16}}>
            <div className="card-title">Presupuesto del proyecto</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 24px'}}>
              {[['aprobado','Presupuesto aprobado (MXN)'],['ejercido','Monto ejercido (MXN)'],['pagado','Monto pagado (MXN)']].map(([k,label])=>(
                <div key={k} className="form-field"><label className="form-label">{label}</label><input className="form-input" type="number" value={pres[k]} onChange={e=>setPres(prev=>({...prev,[k]:e.target.value}))}/></div>
              ))}
              <div className="form-field"><label className="form-label">Por pagar (MXN)</label><input className="form-input" type="number" value={porPagar} readOnly style={{background:'var(--g100)'}}/></div>
            </div>
            <button className="btn-submit" style={{maxWidth:220,marginTop:8}} onClick={()=>api({presupuesto:parseInt(pres.aprobado)||0,pres_ejercido:parseInt(pres.ejercido)||0,pres_pagado:parseInt(pres.pagado)||0}).then(ok=>ok&&showToast('Presupuesto actualizado'))} disabled={saving}>Guardar presupuesto</button>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          {/* Fotos */}
          <div className="card">
            <div className="card-title">Subir fotos a la bitácora</div>
            <label style={{display:'inline-block',padding:'10px 20px',background:'var(--g100)',border:'1px solid var(--border)',cursor:'pointer',fontSize:12,fontFamily:'Jost,sans-serif',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:10}}>
              + Seleccionar fotos
              <input type="file" accept="image/*" multiple style={{display:'none'}} onChange={e=>setFotoFiles(Array.from(e.target.files))}/>
            </label>
            {fotoFiles.length>0&&<p style={{fontSize:12,color:'var(--g500)',marginBottom:8}}>{fotoFiles.length} foto(s) seleccionada(s)</p>}
            {photosDB.length>0&&(
              <div style={{overflowY:'scroll',maxHeight:318,borderTop:'1px solid var(--g100)',marginTop:8,paddingTop:3}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4,marginBottom:12}}>
                  {photosDB.map((f,i)=>(
                    <div key={i} style={{aspectRatio:'1',overflow:'hidden',background:'var(--g100)',position:'relative'}}>
                      <img src={f.url||f.remoteUrl} alt={f.nombre} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                      <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(12,12,12,.5)',padding:'3px 6px'}}>
                        <div style={{fontSize:9,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.nombre}</div>
                      </div>
                      <button onClick={async()=>{
                        if(!confirm('¿Eliminar esta foto?')) return
                        const newPhotos = photosDB.filter((_,idx)=>idx!==i)
                        const ok = await api({photos:newPhotos})
                        if(ok) showToast('Foto eliminada')
                      }} style={{position:'absolute',top:4,right:4,width:20,height:20,borderRadius:'50%',background:'rgba(12,12,12,.7)',border:'none',color:'#fff',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {photosDB.length===0&&<p style={{fontSize:12,color:'var(--g400)',marginBottom:12}}>Sin fotos aún.</p>}
            <button className="btn-submit" style={{maxWidth:180}} onClick={async()=>{
              if(!fotoFiles.length){showToast('Selecciona fotos');return}
              setSaving(true)
              const newPhotos=[...photosDB]
              for(const file of fotoFiles){
                const result=await uploadFile(file,p.id,'project-photos')
                if(result?.url)newPhotos.unshift({nombre:file.name,url:result.url,fecha:new Date().toLocaleDateString('es-MX')})
              }
              const ok=await api({photos:newPhotos})
              if(ok){setFotoFiles([]);showToast('Fotos subidas')}
              setSaving(false)
            }} disabled={saving}>Subir fotos</button>
          </div>

          {/* Bitácora / Post */}
          <div className="card" style={{marginTop:16}}>
            <div className="card-title">Publicar nota del residente</div>
            <div className="form-field"><label className="form-label">Nota semanal</label><textarea className="form-input" placeholder="Describe el avance de esta semana..." value={postText} onChange={e=>setPostText(e.target.value)} rows={4} style={{resize:'vertical',borderBottom:'1.5px solid var(--border)',width:'100%',padding:'8px 0'}}/></div>
            <button className="btn-submit" style={{maxWidth:180}} onClick={async()=>{
              if(!postText.trim()){showToast('Escribe la nota');return}
              const ok=await api({new_post:{texto:postText,autor:user.name||user.email,fecha:new Date().toLocaleString('es-MX'),proyecto:p.nombre,client_email:p.client_email},send_post_email:true})
              if(ok){
                setPostText('')
                showToast('Nota publicada')
                sendBitacoraEmail({
                  clientEmail:      p.client_email,
                  arquitectoNombre: user.name || user.email,
                  arquitectoEmail:  user.email,
                  proyecto:         p.nombre,
                  cliente:          p.cliente,
                  nota:             postText.trim()
                })
              }
            }} disabled={saving}>Publicar nota</button>
            {postsDB.length===0&&<p style={{fontSize:12,color:'var(--g400)',marginTop:8}}>Sin notas publicadas.</p>}
            {postsDB.slice(0,3).map((post,i)=>(
              <div key={i} style={{padding:'10px 0',borderBottom:'1px solid var(--border)',marginTop:i===0?12:0}}>
                <div style={{fontSize:11,color:'var(--g400)',marginBottom:4}}>{post.fecha}</div>
                <div style={{fontSize:13,fontWeight:300,color:'var(--ink)'}}>{post.texto}</div>
              </div>
            ))}
          </div>

          {/* Nota al cliente */}
          <div className="card" style={{marginTop:16}}>
            <div className="card-title">Nota directa al cliente</div>
            <div className="form-field"><label className="form-label">Mensaje</label><textarea className="form-input" placeholder="Mensaje directo al cliente..." value={notaText} onChange={e=>setNotaText(e.target.value)} rows={3} style={{resize:'vertical',borderBottom:'1.5px solid var(--border)',width:'100%',padding:'8px 0'}}/></div>
            <button className="btn-submit" style={{maxWidth:220}} onClick={async()=>{
              if(!notaText.trim()){showToast('Escribe el mensaje');return}
              const newNotes=[{texto:notaText,fecha:new Date().toLocaleString('es-MX')},...notesDB]
              const ok=await api({notes:newNotes,send_nota_email:true})
              if(ok){
                setNotaText('')
                showToast('Nota enviada al cliente')
                sendNotaArqEmail({
                  clientEmail:      p.client_email,
                  arquitectoNombre: user.name || user.email,
                  arquitectoEmail:  user.email,
                  proyecto:         p.nombre,
                  cliente:          p.cliente,
                  nota:             notaText.trim()
                })
              }
            }} disabled={saving}>Enviar nota al cliente</button>
            {notesDB.length===0&&<p style={{fontSize:12,color:'var(--g400)',marginTop:8}}>Sin notas enviadas.</p>}
            {notesDB.slice(0,3).map((n,i)=>(
              <div key={i} style={{padding:'8px 0',borderBottom:'1px solid var(--border)',marginTop:i===0?8:0}}>
                <div style={{fontSize:11,color:'var(--g400)'}}>{n.fecha}</div>
                <div style={{fontSize:13,fontWeight:300,color:'var(--ink)'}}>{n.texto}</div>
              </div>
            ))}
          </div>

          {/* Archivos */}
          <div className="card" style={{marginTop:16}}>
            <div className="card-title">Archivos del proyecto</div>
            <div className="form-field"><label className="form-label">Subir archivo (opcional)</label><input type="file" accept=".pdf,.dwg,.xlsx,.xls,.png,.jpg,.jpeg,.zip" onChange={e=>setArchivoFile(e.target.files[0])} style={{padding:'8px 0',border:'none',borderBottom:'1px solid var(--border)',fontFamily:'Jost,sans-serif',fontSize:12,background:'transparent',color:'var(--g500)',width:'100%',outline:'none'}}/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 24px'}}>
              <div className="form-field"><label className="form-label">Nombre del archivo</label><input className="form-input" placeholder="Plano arquitectonico v3" value={archivoForm.nombre} onChange={e=>setArchivoForm(f=>({...f,nombre:e.target.value}))}/></div>
              <div className="form-field"><label className="form-label">Tipo</label><select className="form-input" style={{cursor:'pointer'}} value={archivoForm.tipo} onChange={e=>setArchivoForm(f=>({...f,tipo:e.target.value}))}>{['PDF','DWG','XLS','IMG','Otro'].map(o=><option key={o}>{o}</option>)}</select></div>
              <div className="form-field"><label className="form-label">Etapa</label><input className="form-input" placeholder="Cimentacion" value={archivoForm.etapa} onChange={e=>setArchivoForm(f=>({...f,etapa:e.target.value}))}/></div>
              <div className="form-field"><label className="form-label">Fecha</label><input className="form-input" type="date" value={archivoForm.fecha} onChange={e=>setArchivoForm(f=>({...f,fecha:e.target.value}))}/></div>
            </div>
            <button className="btn-submit" style={{maxWidth:180}} onClick={async()=>{
              if(!archivoForm.nombre){showToast('Escribe el nombre');return}
              setSaving(true)
              // Extract PDF text in browser BEFORE uploading
              let extractedText = null
              if(archivoFile && (archivoFile.type==='application/pdf' || archivoFile.name.toLowerCase().endsWith('.pdf'))) {
                showToast('Extrayendo texto del PDF...')
                extractedText = await extractPdfTextClient(archivoFile)
              }
              const result = archivoFile ? await uploadFile(archivoFile, p.id, 'project-files') : { url: null }
              const newFiles=[...filesDB,{...archivoForm,url:result?.url||null,fecha:archivoForm.fecha||new Date().toLocaleDateString('es-MX')}]
              let extraPatches = {}
              if(extractedText) {
                const currentKb = (() => { try { return typeof p.knowledge_base==='string'?JSON.parse(p.knowledge_base):(Array.isArray(p.knowledge_base)?p.knowledge_base:[]) } catch { return [] } })()
                const newKb = [...currentKb, { tema: archivoForm.nombre, info: extractedText }]
                extraPatches = { knowledge_base: newKb }
              }
              const ok=await api({files:newFiles, ...extraPatches})
              if(ok){
                setArchivoForm({nombre:'',tipo:'PDF',etapa:'',fecha:''})
                setArchivoFile(null)
                showToast(extractedText ? 'PDF subido y texto extraído a base de conocimiento ✓' : 'Archivo agregado')
              }
              setSaving(false)
            }} disabled={saving}>Agregar archivo</button>
          </div>

          {/* Gastos */}
          <div className="card" style={{marginTop:16}}>
            <div className="card-title">Agregar gasto</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 24px'}}>
              <div className="form-field" style={{gridColumn:'1/-1'}}><label className="form-label">Concepto</label><input className="form-input" value={costoForm.concepto} onChange={e=>setCostoForm(f=>({...f,concepto:e.target.value}))}/></div>
              <div className="form-field"><label className="form-label">Categoría</label><select className="form-input" style={{cursor:'pointer'}} value={costoForm.categoria} onChange={e=>setCostoForm(f=>({...f,categoria:e.target.value}))}>{['Material','Mano de obra','Equipo','Honorarios','Otro'].map(o=><option key={o}>{o}</option>)}</select></div>
              <div className="form-field"><label className="form-label">Monto MXN</label><input className="form-input" type="number" value={costoForm.monto} onChange={e=>setCostoForm(f=>({...f,monto:e.target.value}))}/></div>
              <div className="form-field"><label className="form-label">Estatus</label><select className="form-input" style={{cursor:'pointer'}} value={costoForm.estatus} onChange={e=>setCostoForm(f=>({...f,estatus:e.target.value}))}>{['Pagado','Parcial','Pendiente'].map(o=><option key={o}>{o}</option>)}</select></div>
              <div className="form-field"><label className="form-label">Fecha</label><input className="form-input" type="date" value={costoForm.fecha} onChange={e=>setCostoForm(f=>({...f,fecha:e.target.value}))}/></div>
            </div>
            <button className="btn-submit" style={{maxWidth:180}} onClick={async()=>{
              if(!costoForm.concepto){showToast('Escribe el concepto');return}
              const newCosts=[...costsDB,{...costoForm,monto:parseInt(costoForm.monto)||0}]
              const ok=await api({costs:newCosts})
              if(ok){setCostoForm({concepto:'',categoria:'Material',etapa:'',monto:'',estatus:'Pendiente',fecha:''});showToast('Gasto registrado')}
            }} disabled={saving}>Agregar gasto</button>
          </div>
        </div>
      </div>

      {toast&&<div style={{position:'fixed',bottom:32,left:'50%',transform:'translateX(-50%)',background:'var(--ink)',color:'var(--white)',padding:'12px 24px',fontSize:13,fontWeight:300,zIndex:9999,borderRadius:2}}>{toast}</div>}
    </div>
  )
}
