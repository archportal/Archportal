'use client'
import { useState, useRef, useEffect } from 'react'
import { sendBitacoraEmail, sendClientAccessEmail } from '@/lib/emailjs'
import { supabase } from '@/lib/supabase'

// ===== Constantes visuales (mismo lenguaje que Dashboard) =====
const CARD_RADIUS = 12
const INPUT_RADIUS = 6
const BTN_RADIUS = 6

// ===== Íconos SVG dorados (22px para títulos de sección) =====
const IconInfo = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <line x1="12" y1="11" x2="12" y2="17"/>
    <circle cx="12" cy="7.5" r="1" fill="currentColor"/>
  </svg>
)
const IconPercent = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19"/>
    <circle cx="7.5" cy="7.5" r="2.5"/>
    <circle cx="16.5" cy="16.5" r="2.5"/>
  </svg>
)
const IconMoney = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M14.5 9.5c-.5-.9-1.5-1.5-2.5-1.5-1.7 0-3 1-3 2.3 0 1.2 1 1.9 2.5 2.2l1 .2c1.5.3 2.5 1 2.5 2.2 0 1.3-1.3 2.3-3 2.3-1 0-2-.6-2.5-1.5"/>
    <path d="M12 7v1M12 16v1"/>
  </svg>
)
const IconKey = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="15" r="4"/>
    <path d="M10.85 12.15L21 2l-3 3"/>
    <path d="M17 7l2 2"/>
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
const IconFolder = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
  </svg>
)
const IconWallet = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2"/>
    <path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2z"/>
    <circle cx="16.5" cy="13.5" r="1.2" fill="currentColor"/>
  </svg>
)
const IconUser = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
  </svg>
)

// Mapa de ícono por sección
const SECTION_ICONS = {
  info: IconInfo,
  etapas: IconPercent,
  presupuesto: IconMoney,
  acceso: IconKey,
  fotos: IconCamera,
  bitacora: IconNotebook,
  archivos: IconFolder,
  gastos: IconWallet,
  cuenta: IconUser,
}

// ========== Compresión de imágenes (igual que antes) ==========
async function compressImage(file, onProgress) {
  if (!file.type.startsWith('image/') || file.size < 500 * 1024) return file
  return new Promise((resolve) => {
    const reader = new FileReader()
    const timeout = setTimeout(() => { console.warn('Compression timeout, using original'); onProgress?.(30); resolve(file) }, 20000)
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        try {
          onProgress?.(15)
          const MAX_SIZE = 1600
          let { width, height } = img
          if (width > height && width > MAX_SIZE) { height = Math.round(height * (MAX_SIZE / width)); width = MAX_SIZE }
          else if (height > MAX_SIZE) { width = Math.round(width * (MAX_SIZE / height)); height = MAX_SIZE }
          const canvas = document.createElement('canvas')
          canvas.width = width; canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          onProgress?.(25)
          canvas.toBlob((blob) => {
            clearTimeout(timeout)
            if (!blob) { console.warn('toBlob failed, using original'); resolve(file); return }
            const newName = file.name.replace(/\.[^.]+$/, '.jpg')
            const newFile = new File([blob], newName, { type: 'image/jpeg' })
            canvas.width = 0; canvas.height = 0
            onProgress?.(30)
            resolve(newFile)
          }, 'image/jpeg', 0.75)
        } catch (err) { clearTimeout(timeout); console.warn('Canvas compression error:', err.message); resolve(file) }
      }
      img.onerror = () => { clearTimeout(timeout); console.warn('Image load failed, using original'); resolve(file) }
      img.src = e.target.result
    }
    reader.onerror = () => { clearTimeout(timeout); console.warn('FileReader failed, using original'); resolve(file) }
    reader.readAsDataURL(file)
  })
}

async function extractPdfTextClient(file) {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
    let fullText = ''
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      fullText += content.items.map(item => item.str).join(' ') + '\n'
    }
    return fullText.trim().substring(0, 3000)
  } catch (e) { console.warn('PDF client extraction error:', e.message); return null }
}

async function uploadFile(file, projectId, bucket, onProgress) {
  if (!file) return null
  onProgress?.(5)
  const processed = await compressImage(file, onProgress)
  onProgress?.(35)
  const fileName = processed.name.replace(/\s/g, '_')
  const path = `${projectId}/${Date.now()}_${fileName}`
  const arrayBuffer = await processed.arrayBuffer()
  onProgress?.(50)
  let simulated = 50
  const progressInterval = setInterval(() => { if (simulated < 85) { simulated += 2; onProgress?.(simulated) } }, 400)
  const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, { contentType: processed.type, upsert: true })
  clearInterval(progressInterval)
  if (error) { console.warn('Upload error:', error.message); onProgress?.(0); return null }
  onProgress?.(95)
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
  onProgress?.(100)
  return { url: publicUrl }
}

// Secciones sin "notas" (eliminada)
const SECTIONS = [
  { id:'info',       label:'Info' },
  { id:'etapas',     label:'Etapas' },
  { id:'presupuesto',label:'Presupuesto' },
  { id:'acceso',     label:'Acceso' },
  { id:'fotos',      label:'Fotos' },
  { id:'bitacora',   label:'Bitácora' },
  { id:'archivos',   label:'Archivos' },
  { id:'gastos',     label:'Gastos' },
  { id:'cuenta',     label:'Mi cuenta' },
]

// ===== SectionCard con ícono dorado =====
const SectionCard = ({ id, title, children, extra, autoSaving, sectionRef }) => {
  const Icon = SECTION_ICONS[id]
  return (
    <div ref={sectionRef} className="card" style={{marginBottom:14, scrollMarginTop:120, borderRadius: CARD_RADIUS, overflow:'hidden'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,gap:12,flexWrap:'wrap'}}>
        <div className="card-title" style={{marginBottom:0, display:'flex', alignItems:'center', gap:10}}>
          {Icon && <span style={{color:'var(--gold)', display:'inline-flex', flexShrink:0}}><Icon /></span>}
          <span>{title}</span>
        </div>
        {extra}
        {autoSaving && <span style={{fontSize:10,color:'var(--g400)',letterSpacing:'.08em'}}>Guardando...</span>}
      </div>
      {children}
    </div>
  )
}

// ===== EtapaRow refactorizada con bordes redondeados =====
function EtapaRow({ etapa, index, dragIndexRef, onUpdate, onDelete, onQuickAction, inputStyle, selectStyle }) {
  const [nombre, setNombre] = useState(etapa.nombre)
  const [fechas, setFechas] = useState(etapa.fechas)
  useEffect(() => { setNombre(etapa.nombre) }, [etapa.nombre])
  useEffect(() => { setFechas(etapa.fechas) }, [etapa.fechas])

  return (
    <div
      onDragOver={ev=>{ev.preventDefault();ev.currentTarget.style.borderTop='2px solid var(--ink)'}}
      onDragLeave={ev=>{ev.currentTarget.style.borderTop='none'}}
      onDrop={ev=>{ev.currentTarget.style.borderTop='none';const from=dragIndexRef.current;if(from===index)return;onQuickAction(index,'drop',from)}}
      style={{
        background: etapa.estatus==='En curso' ? 'rgba(200,169,110,.06)' : etapa.estatus==='Completado' ? 'rgba(45,80,22,.04)' : 'var(--paper)',
        padding:'12px 14px',
        marginBottom:8,
        border:'1px solid',
        borderColor: etapa.estatus==='En curso' ? 'rgba(200,169,110,.3)' : etapa.estatus==='Completado' ? 'rgba(45,80,22,.2)' : 'var(--border)',
        borderRadius: 8,
      }}>
      <div style={{display:'grid',gridTemplateColumns:'20px 1fr 1fr auto auto',gap:8,marginBottom:10,alignItems:'start'}}>
        <div draggable onDragStart={()=>{dragIndexRef.current=index}} style={{fontSize:16,color:'var(--g300)',paddingTop:20,cursor:'grab',userSelect:'none',textAlign:'center'}}>⠿</div>
        <div>
          <label className="form-label">Nombre</label>
          <input style={inputStyle} value={nombre} onChange={ev=>setNombre(ev.target.value)} onBlur={ev=>onUpdate(index,'nombre',ev.target.value)}/>
        </div>
        <div>
          <label className="form-label">Periodo</label>
          <input style={inputStyle} value={fechas} onChange={ev=>setFechas(ev.target.value)} onBlur={ev=>onUpdate(index,'fechas',ev.target.value)}/>
        </div>
        <div>
          <label className="form-label">Estatus</label>
          <select style={selectStyle} value={etapa.estatus} onChange={ev=>onUpdate(index,'estatus',ev.target.value)}>
            {['Pendiente','En curso','Completado'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{paddingTop:18}}>
          <button onClick={()=>onDelete(index)} style={{background:'#B83232',color:'#fff',border:'none',width:26,height:26,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%'}}>✕</button>
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:8,paddingLeft:28,flexWrap:'wrap'}}>
        <span style={{fontSize:11,color:'var(--g500)',width:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flexShrink:0}}>{etapa.nombre||'Etapa'}</span>
        <input type="range" min="0" max="100" value={etapa.porcentaje}
          onChange={ev=>onUpdate(index,'porcentaje',parseInt(ev.target.value))}
          style={{flex:2,accentColor:'var(--ink)',minWidth:80}}/>
        <span style={{fontSize:13,fontWeight:600,color:'var(--ink)',width:36,textAlign:'right',flexShrink:0}}>{etapa.porcentaje}%</span>
        <div style={{display:'flex',gap:4,flexShrink:0}}>
          {etapa.estatus!=='En curso' && (
            <button onClick={()=>onQuickAction(index,'iniciar')}
              style={{fontSize:10,padding:'4px 10px',background:'rgba(200,169,110,.12)',border:'1px solid rgba(200,169,110,.4)',color:'#7A4A00',cursor:'pointer',fontFamily:'Jost,sans-serif',letterSpacing:'.04em',whiteSpace:'nowrap',borderRadius:BTN_RADIUS}}>
              ▶ Iniciar
            </button>
          )}
          {etapa.estatus!=='Completado' && (
            <button onClick={()=>onQuickAction(index,'completar')}
              style={{fontSize:10,padding:'4px 10px',background:'rgba(45,80,22,.08)',border:'1px solid rgba(45,80,22,.2)',color:'#2D5016',cursor:'pointer',fontFamily:'Jost,sans-serif',letterSpacing:'.04em',whiteSpace:'nowrap',borderRadius:BTN_RADIUS}}>
              ✓ Completar
            </button>
          )}
          {etapa.estatus!=='Pendiente' && (
            <button onClick={()=>onQuickAction(index,'pendiente')}
              style={{fontSize:10,padding:'4px 10px',background:'var(--g100)',border:'1px solid var(--border)',color:'var(--g500)',cursor:'pointer',fontFamily:'Jost,sans-serif',letterSpacing:'.04em',borderRadius:BTN_RADIUS}}>
              Resetear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ======================== COMPONENTE PRINCIPAL ========================
export default function Admin({ project, user, onRefresh }) {
  const p = project?.project || project || {}
  const stagesDB = project?.stages || []
  const costsDB  = project?.costs  || []
  const postsDB  = project?.posts  || []
  const photosDB = project?.photos || []
  const filesDB  = project?.files  || []

  const [info, setInfo] = useState({ nombre:p.nombre||'', cliente:p.cliente||'', ubicacion:p.ubicacion||'', arquitecto:p.arquitecto||'', superficie:p.superficie||'', niveles:p.niveles||'', inicio:p.inicio||'', entrega:p.entrega||'', etapa_actual:p.etapa_actual||'' })
  const [pres, setPres] = useState({ aprobado:p.presupuesto||'', ejercido:p.pres_ejercido||'', pagado:p.pres_pagado||'' })
  const [etapas, setEtapas] = useState(stagesDB.length ? stagesDB.map(s=>({nombre:s.nombre||'',fechas:s.fechas||'Por definir',estatus:s.estatus||'Pendiente',porcentaje:s.porcentaje||0})) : [{nombre:'Proyecto arquitectonico',fechas:'Por definir',estatus:'Pendiente',porcentaje:0}])
  const dragIndex = useRef(null)
  const [costoForm, setCostoForm] = useState({concepto:'',categoria:'Material',etapa:'',monto:'',estatus:'Pendiente',fecha:''})
  const [editingCost, setEditingCost] = useState(null)
  const [archivoForm, setArchivoForm] = useState({nombre:'',tipo:'PDF',etapa:'',fecha:''})
  const [archivoFile, setArchivoFile] = useState(null)
  const [fotoFiles, setFotoFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [postText, setPostText] = useState('')
  const [clientEmail, setClientEmail] = useState(p.client_email||'')
  const [clientPass, setClientPass] = useState(p.client_pass||'')
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [accountName, setAccountName] = useState(user.name||'')
  const [newPass, setNewPass] = useState('')
  const [newPass2, setNewPass2] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [activeSection, setActiveSection] = useState('info')

  const sectionRefs = useRef({})
  const showToast = (msg, isError=false, retryBody=null) => {
    setToast({ msg, isError, retryBody })
    if (!isError) setTimeout(()=>setToast(''), 3000)
  }

  const api = async (body, silent = false) => {
    if (!silent) setSaving(true)
    else setAutoSaving(true)
    try {
      const res = await fetch('/api/projects', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:p.id,...body}) })
      const data = await res.json()
      if (!res.ok) { showToast('Error: '+(data.error||'desconocido'), true, body); return false }
      await onRefresh?.()
      return true
    } catch(e) { showToast('Error de conexión — verifica tu internet', true, body); return false }
    finally { setSaving(false); setAutoSaving(false) }
  }

  const handleInfoBlur = async (key, val) => {
    if (val === (p[key]||'')) return
    await api({ [key]: val }, true)
  }

  const deletePost = async (i) => {
    if (!confirm('¿Eliminar esta nota?')) return
    const ok = await api({posts: postsDB.filter((_,idx)=>idx!==i)})
    if (ok) showToast('Nota eliminada')
  }

  const scrollTo = (id) => {
    setActiveSection(id)
    sectionRefs.current[id]?.scrollIntoView({ behavior:'smooth', block:'start' })
  }

  const quickStageAction = (i, action, from) => {
    setEtapas(prev => {
      if (action === 'drop') {
        const arr = [...prev]; const [item] = arr.splice(from, 1); arr.splice(i, 0, item); return arr
      }
      return prev.map((e, idx) => {
        if (idx !== i) return e
        if (action === 'iniciar') return { ...e, estatus:'En curso', porcentaje: e.porcentaje || 10 }
        if (action === 'completar') return { ...e, estatus:'Completado', porcentaje: 100 }
        if (action === 'pendiente') return { ...e, estatus:'Pendiente', porcentaje: 0 }
        return e
      })
    })
  }

  const handleEtapaUpdate = (i, field, value) => {
    setEtapas(prev => prev.map((x, idx) => idx === i ? { ...x, [field]: value } : x))
  }
  const handleEtapaDelete = (i) => {
    setEtapas(prev => prev.filter((_, idx) => idx !== i))
  }

  const porPagar = Math.max(0,(parseInt(pres.ejercido)||0)-(parseInt(pres.pagado)||0))
  const presupuestoNum = parseInt(pres.aprobado)||0
  const ejercidoNum = parseInt(pres.ejercido)||0
  const pagadoNum = parseInt(pres.pagado)||0

  // ===== Estilos de inputs/selects con bordes redondeados =====
  const inputStyle = {
    padding:'10px 12px',
    border:'1px solid var(--border)',
    borderRadius: INPUT_RADIUS,
    fontFamily:'Jost,sans-serif',
    fontSize:13,
    background:'var(--white)',
    color:'var(--ink)',
    outline:'none',
    width:'100%',
    boxSizing:'border-box',
  }
  const selectStyle = { ...inputStyle, cursor:'pointer' }

  // Botón submit redondeado (override de .btn-submit que llega del CSS global)
  const btnSubmitStyle = { borderRadius: BTN_RADIUS }

  return (
    <div>
      <style>{`
        /* Override: tarjetas e inputs redondeados dentro de Admin */
        .admin-root .card { border-radius: ${CARD_RADIUS}px !important; overflow: hidden; }
        .admin-root .section-hero { border-radius: ${CARD_RADIUS}px !important; overflow: hidden; }
        .admin-root input, .admin-root select, .admin-root textarea { border-radius: ${INPUT_RADIUS}px !important; }
        .admin-root .btn-submit { border-radius: ${BTN_RADIUS}px !important; }
        .admin-root .chip { border-radius: 999px !important; }
      `}</style>

      <div className="admin-root">

      <div className="section-hero" style={{marginBottom:0}}>
        <div className="section-hero-eyebrow" style={{color:'var(--gold)', fontWeight:500}}>Modo edición activo</div>
        <h1 className="section-hero-title">Panel de administración</h1>
        <p className="section-hero-sub">Los cambios se reflejan de inmediato al cliente</p>
      </div>

      {/* ── NAV STICKY ───────────────────────────────── */}
      <div style={{position:'sticky',top:0,zIndex:90,background:'var(--white)',borderBottom:'1px solid var(--border)',padding:'0 4px',display:'flex',gap:0,overflowX:'auto',scrollbarWidth:'none',WebkitOverflowScrolling:'touch',msOverflowStyle:'none'}}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={()=>scrollTo(s.id)}
            style={{padding:'10px 16px',background:'none',border:'none',fontFamily:'Jost,sans-serif',fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,color:activeSection===s.id?'var(--ink)':'var(--g400)',fontWeight:activeSection===s.id?600:400,borderBottom:activeSection===s.id?'2px solid var(--gold)':'2px solid transparent',transition:'all .2s'}}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{paddingTop:12}}>

      {/* ── INFO GENERAL ─────────────────────────────── */}
      <SectionCard autoSaving={autoSaving} sectionRef={el => sectionRefs.current["info"] = el} id="info" title="Información general del proyecto">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:16}}>
          {[['nombre','Nombre'],['cliente','Cliente'],['ubicacion','Ubicación'],['arquitecto','Arquitecto'],['superficie','Superficie m²'],['niveles','Niveles'],['inicio','Fecha inicio'],['entrega','Entrega estimada'],['etapa_actual','Etapa actual']].map(([k,label])=>(
            <div key={k}>
              <label className="form-label" style={{marginBottom:6,display:'block'}}>{label}</label>
              <input style={inputStyle} value={info[k]}
                onChange={e=>setInfo(i=>({...i,[k]:e.target.value}))}
                onBlur={e=>handleInfoBlur(k,e.target.value)}/>
            </div>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <button className="btn-submit" style={{...btnSubmitStyle, maxWidth:200, marginTop:0}} onClick={()=>api(info).then(ok=>ok&&showToast('Información guardada'))} disabled={saving}>Guardar todo</button>
          <span style={{fontSize:11,color:'var(--g400)',fontWeight:300}}>Los campos se auto-guardan al salir de cada uno</span>
        </div>
      </SectionCard>

      {/* ── ETAPAS ───────────────────────────────────── */}
      <SectionCard autoSaving={autoSaving} sectionRef={el => sectionRefs.current["etapas"] = el} id="etapas" title="Avance por etapa (%)">
        <p style={{fontSize:12,fontWeight:300,color:'var(--g400)',marginBottom:12}}>
          Usa los botones rápidos o mueve el slider. Arrastra <span style={{color:'var(--ink)'}}>⠿</span> para reordenar.
        </p>
        <div style={{marginBottom:10,maxHeight:560,overflowY:'auto',paddingRight:4}}>
          {etapas.map((e,i)=>(
            <EtapaRow key={i} etapa={e} index={i}
              dragIndexRef={dragIndex}
              onUpdate={handleEtapaUpdate}
              onDelete={handleEtapaDelete}
              onQuickAction={quickStageAction}
              inputStyle={inputStyle}
              selectStyle={selectStyle}/>
          ))}
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button onClick={()=>setEtapas(prev=>[...prev,{nombre:'',fechas:'Por definir',estatus:'Pendiente',porcentaje:0}])} style={{padding:'10px 16px',background:'transparent',border:'1px solid var(--border)',borderRadius:BTN_RADIUS,fontFamily:'Jost,sans-serif',fontSize:11,color:'var(--g500)',cursor:'pointer',letterSpacing:'.08em',textTransform:'uppercase'}}>+ Agregar etapa</button>
          <button className="btn-submit" style={{...btnSubmitStyle, maxWidth:200, marginTop:0}} onClick={()=>api({stages:etapas}).then(ok=>ok&&showToast('Cronograma guardado ✓'))} disabled={saving}>Guardar avances</button>
        </div>
      </SectionCard>

      {/* ── PRESUPUESTO ──────────────────────────────── */}
      <SectionCard autoSaving={autoSaving} sectionRef={el => sectionRefs.current["presupuesto"] = el} id="presupuesto" title="Presupuesto del proyecto">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:16}}>
          {[['aprobado','Presupuesto aprobado (MXN)'],['ejercido','Gastado hasta hoy (MXN)'],['pagado','Monto pagado (MXN)']].map(([k,label])=>(
            <div key={k}>
              <label className="form-label" style={{marginBottom:6,display:'block'}}>{label}</label>
              <input style={inputStyle} type="number" value={pres[k]} onChange={e=>setPres(prev=>({...prev,[k]:e.target.value}))}/>
            </div>
          ))}
          <div>
            <label className="form-label" style={{marginBottom:6,display:'block'}}>Por pagar (automático)</label>
            <input style={{...inputStyle,background:'var(--g100)',color:'var(--g500)'}} type="number" value={porPagar} readOnly/>
          </div>
        </div>
        {/* Preview en tiempo real */}
        {presupuestoNum > 0 && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
            {[
              ['Ejercido',Math.round(ejercidoNum/presupuestoNum*100)+'%',ejercidoNum<=presupuestoNum?'var(--success)':'var(--danger)'],
              ['Pagado',Math.round(pagadoNum/presupuestoNum*100)+'%','var(--ink)'],
              ['Disponible',Math.max(0,Math.round((presupuestoNum-ejercidoNum)/presupuestoNum*100))+'%','var(--g400)'],
            ].map(([label,pct,color])=>(
              <div key={label} style={{background:'var(--off)',padding:'12px',textAlign:'center',border:'1px solid var(--border)', borderRadius:INPUT_RADIUS}}>
                <div style={{fontSize:9,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--g400)',marginBottom:4}}>{label}</div>
                <div style={{fontSize:22,fontFamily:'Cormorant Garamond,serif',color,fontWeight:400}}>{pct}</div>
              </div>
            ))}
          </div>
        )}
        <button className="btn-submit" style={{...btnSubmitStyle, maxWidth:220}} onClick={()=>api({presupuesto:parseInt(pres.aprobado)||0,pres_ejercido:parseInt(pres.ejercido)||0,pres_pagado:parseInt(pres.pagado)||0}).then(ok=>ok&&showToast('Presupuesto actualizado ✓'))} disabled={saving}>Guardar presupuesto</button>
      </SectionCard>

      {/* ── ACCESO CLIENTE ───────────────────────────── */}
      <SectionCard autoSaving={autoSaving} sectionRef={el => sectionRefs.current["acceso"] = el} id="acceso" title="Acceso del cliente">
        <p style={{fontSize:12,fontWeight:300,color:'var(--g400)',marginBottom:12,lineHeight:1.7}}>Define las credenciales para que tu cliente entre a ver este proyecto.</p>
        {p.client_last_seen && (
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 14px',background:'var(--success-bg)',marginBottom:12,borderRadius:INPUT_RADIUS}}>
            <span style={{fontSize:18}}>✅</span>
            <span style={{fontSize:12,color:'var(--success)',fontWeight:400}}>
              Tu cliente entró por última vez el {new Date(p.client_last_seen).toLocaleString('es-MX',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
            </span>
          </div>
        )}
        {!p.client_last_seen && clientEmail && (
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 14px',background:'var(--warn-bg)',marginBottom:12,borderRadius:INPUT_RADIUS}}>
            <span style={{fontSize:18}}>⏳</span>
            <span style={{fontSize:12,color:'var(--warn)'}}>El cliente aún no ha ingresado al portal</span>
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:12}}>
          <div>
            <label className="form-label" style={{marginBottom:6,display:'block'}}>Email del cliente</label>
            <input style={inputStyle} type="email" placeholder="cliente@email.com" value={clientEmail} onChange={e=>setClientEmail(e.target.value)}/>
          </div>
          <div>
            <label className="form-label" style={{marginBottom:6,display:'block'}}>Contraseña</label>
            <input style={inputStyle} placeholder="Contraseña para el cliente" value={clientPass} onChange={e=>setClientPass(e.target.value)}/>
          </div>
        </div>
        <button className="btn-submit" style={{...btnSubmitStyle, maxWidth:220}} onClick={async()=>{
          const ok = await api({client_email:clientEmail, client_pass:clientPass})
          if(ok) { showToast('Acceso guardado ✓'); sendClientAccessEmail({nombreCliente:p.cliente,emailCliente:clientEmail,passwordCliente:clientPass,proyecto:p.nombre,nombreArquitecto:user.name||user.email,emailArquitecto:user.email}) }
        }} disabled={saving}>Guardar y enviar acceso</button>
      </SectionCard>

      {/* ── FOTOS ────────────────────────────────────── */}
      <SectionCard autoSaving={autoSaving} sectionRef={el => sectionRefs.current["fotos"] = el} id="fotos" title="Fotos de la bitácora">
        <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}>
          <label style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',background:'var(--ink)',color:'var(--white)',cursor:'pointer',fontSize:11,fontFamily:'Jost,sans-serif',letterSpacing:'.08em',textTransform:'uppercase',borderRadius:BTN_RADIUS}}>
            + Seleccionar fotos
            <input type="file" accept="image/*" multiple style={{display:'none'}} onChange={e=>setFotoFiles(Array.from(e.target.files))}/>
          </label>
          {fotoFiles.length>0 && (
            <span style={{fontSize:12,color:'var(--g500)'}}>{fotoFiles.length} foto(s) lista(s) para subir</span>
          )}
        </div>

        {/* Progress per file */}
        {Object.entries(uploadProgress).map(([name,pct])=>(
          <div key={name} style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:11,color:'var(--g500)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'80%'}}>{name}</span>
              <span style={{fontSize:11,color:'var(--ink)',flexShrink:0}}>{pct}%</span>
            </div>
            <div style={{height:4,background:'var(--g100)',borderRadius:2}}>
              <div style={{height:4,background:pct===100?'var(--success)':'var(--gold)',borderRadius:2,width:pct+'%',transition:'width .3s'}}/>
            </div>
          </div>
        ))}

        {photosDB.length>0 && (
          <div style={{overflowY:'auto',maxHeight:300,marginBottom:12}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
              {photosDB.map((f,i)=>(
                <div key={i} style={{aspectRatio:'1',overflow:'hidden',background:'var(--g100)',position:'relative',borderRadius:6}}>
                  <img src={f.url||f.remoteUrl} alt={f.nombre} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                  <button onClick={async()=>{ if(!confirm('¿Eliminar?')) return; const ok=await api({photos:photosDB.filter((_,idx)=>idx!==i)}); if(ok) showToast('Foto eliminada') }}
                    style={{position:'absolute',top:4,right:4,width:22,height:22,borderRadius:'50%',background:'rgba(12,12,12,.75)',border:'none',color:'#fff',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {photosDB.length===0 && <p style={{fontSize:12,color:'var(--g400)',marginBottom:12}}>Sin fotos aún.</p>}

        <button className="btn-submit" style={{...btnSubmitStyle, maxWidth:180}} disabled={saving||!fotoFiles.length} onClick={async()=>{
          setSaving(true)
          const newPhotos=[...photosDB]
          const newProgress = {}
          for(const file of fotoFiles){
            newProgress[file.name] = 0
            setUploadProgress({...newProgress})
            const result = await uploadFile(file, p.id, 'project-photos', pct => {
              newProgress[file.name] = pct
              setUploadProgress({...newProgress})
            })
            if(result?.url) newPhotos.unshift({nombre:file.name,url:result.url,fecha:new Date().toLocaleDateString('es-MX')})
          }
          const ok=await api({photos:newPhotos})
          if(ok){ setFotoFiles([]); setUploadProgress({}); showToast('Fotos subidas ✓') }
          setSaving(false)
        }}>Subir fotos</button>
      </SectionCard>

      {/* ── BITÁCORA ─────────────────────────────────── */}
      <SectionCard autoSaving={autoSaving} sectionRef={el => sectionRefs.current["bitacora"] = el} id="bitacora" title="Nota de bitácora">
        <p style={{fontSize:12,fontWeight:300,color:'var(--g400)',marginBottom:12,lineHeight:1.7}}>El cliente recibe un correo con cada nota que publiques.</p>
        <textarea style={{...inputStyle,resize:'vertical',marginBottom:12,fontFamily:'Jost,sans-serif'}} placeholder="Describe el avance de esta semana — el cliente lo verá en su portal y recibirá un email..." value={postText} onChange={e=>setPostText(e.target.value)} rows={4}/>
        <button className="btn-submit" style={{...btnSubmitStyle, maxWidth:220, marginBottom:postsDB.length>0?16:0}} disabled={saving||!postText.trim()} onClick={async()=>{
          const ok=await api({new_post:{texto:postText,autor:user.name||user.email,fecha:new Date().toLocaleString('es-MX'),proyecto:p.nombre,client_email:p.client_email},send_post_email:true})
          if(ok){ setPostText(''); showToast('Nota publicada ✓'); sendBitacoraEmail({clientEmail:p.client_email,arquitectoNombre:user.name||user.email,arquitectoEmail:user.email,proyecto:p.nombre,cliente:p.cliente,nota:postText.trim()}) }
        }}>Publicar y notificar</button>
        {postsDB.length>0 && (
          <div style={{borderTop:'1px solid var(--border)',paddingTop:12,marginTop:4}}>
            <div style={{fontSize:10,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--gold)',fontWeight:600,marginBottom:10}}>Notas anteriores</div>
            <div style={{maxHeight:260,overflowY:'auto',paddingRight:4}}>
              {postsDB.map((post,i)=>(
                <div key={i} style={{padding:'12px 0',borderBottom:'1px solid var(--g100)',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,color:'var(--gold)',fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:5}}>{post.fecha}</div>
                    <div style={{fontSize:14,fontWeight:400,color:'var(--ink)',lineHeight:1.6,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{post.texto}</div>
                  </div>
                  <button onClick={()=>deletePost(i)} style={{fontSize:10,color:'var(--danger)',background:'transparent',border:'1px solid var(--danger)',padding:'4px 10px',cursor:'pointer',flexShrink:0,fontFamily:'Jost,sans-serif',borderRadius:BTN_RADIUS}}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── ARCHIVOS ─────────────────────────────────── */}
      <SectionCard autoSaving={autoSaving} sectionRef={el => sectionRefs.current["archivos"] = el} id="archivos" title="Archivos del proyecto">
        <div style={{marginBottom:12}}>
          <label className="form-label" style={{marginBottom:6,display:'block'}}>Archivo (opcional)</label>
          <input type="file" accept=".pdf,.dwg,.xlsx,.xls,.png,.jpg,.jpeg,.zip" onChange={e=>setArchivoFile(e.target.files[0])} style={{padding:'8px 0',border:'none',borderBottom:'1px solid var(--border)',fontFamily:'Jost,sans-serif',fontSize:12,background:'transparent',color:'var(--g500)',width:'100%',outline:'none'}}/>
          {archivoFile && <span style={{fontSize:11,color:'var(--gold)',marginTop:4,display:'block'}}>📎 {archivoFile.name} — listo para subir</span>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:12}}>
          <div>
            <label className="form-label" style={{marginBottom:6,display:'block'}}>Nombre del archivo</label>
            <input style={inputStyle} placeholder="Plano arquitectonico v3" value={archivoForm.nombre} onChange={e=>setArchivoForm(f=>({...f,nombre:e.target.value}))}/>
          </div>
          <div>
            <label className="form-label" style={{marginBottom:6,display:'block'}}>Tipo</label>
            <select style={selectStyle} value={archivoForm.tipo} onChange={e=>setArchivoForm(f=>({...f,tipo:e.target.value}))}>{['PDF','DWG','XLS','IMG','Otro'].map(o=><option key={o}>{o}</option>)}</select>
          </div>
          <div>
            <label className="form-label" style={{marginBottom:6,display:'block'}}>Etapa</label>
            <input style={inputStyle} placeholder="Cimentacion" value={archivoForm.etapa} onChange={e=>setArchivoForm(f=>({...f,etapa:e.target.value}))}/>
          </div>
          <div>
            <label className="form-label" style={{marginBottom:6,display:'block'}}>Fecha</label>
            <input style={inputStyle} type="date" value={archivoForm.fecha} onChange={e=>setArchivoForm(f=>({...f,fecha:e.target.value}))}/>
          </div>
        </div>
        <button className="btn-submit" style={{...btnSubmitStyle, maxWidth:180}} disabled={saving||!archivoForm.nombre} onClick={async()=>{
          setSaving(true)
          let extractedText = null
          if(archivoFile&&(archivoFile.type==='application/pdf'||archivoFile.name.toLowerCase().endsWith('.pdf'))) { showToast('Extrayendo texto del PDF...'); extractedText=await extractPdfTextClient(archivoFile) }
          const result=archivoFile?await uploadFile(archivoFile,p.id,'project-files'):{url:null}
          const newFiles=[...filesDB,{...archivoForm,url:result?.url||null,fecha:archivoForm.fecha||new Date().toLocaleDateString('es-MX')}]
          let extraPatches={}
          if(extractedText){ const currentKb=(()=>{try{return typeof p.knowledge_base==='string'?JSON.parse(p.knowledge_base):(Array.isArray(p.knowledge_base)?p.knowledge_base:[])}catch{return[]}})(); extraPatches={knowledge_base:[...currentKb,{tema:archivoForm.nombre,info:extractedText}]} }
          const ok=await api({files:newFiles,...extraPatches})
          if(ok){ setArchivoForm({nombre:'',tipo:'PDF',etapa:'',fecha:''}); setArchivoFile(null); showToast(extractedText?'PDF subido y texto extraído ✓':'Archivo agregado ✓') }
          setSaving(false)
        }}>Agregar archivo</button>
      </SectionCard>

      {/* ── GASTOS ───────────────────────────────────── */}
      <SectionCard autoSaving={autoSaving} sectionRef={el => sectionRefs.current["gastos"] = el} id="gastos" title="Gastos del proyecto">
        {costsDB.length > 0 && (
          <div style={{marginBottom:16,maxHeight:520,overflowY:'auto',paddingRight:4}}>
            <div style={{fontSize:10,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--g400)',marginBottom:10}}>Gastos registrados — clic para editar</div>
            {costsDB.map((c,i)=>(
              <div key={i} style={{padding:'12px 14px',marginBottom:6,border:'1px solid',borderColor:editingCost===i?'var(--ink)':'var(--border)',background:editingCost===i?'var(--off)':'var(--white)',cursor:'pointer',borderRadius:8}}
                onClick={()=>{ if(editingCost===i){setEditingCost(null)}else{setEditingCost(i);setCostoForm({concepto:c.concepto,categoria:c.categoria||'Material',etapa:c.etapa||'',monto:c.monto||'',estatus:c.estatus||'Pendiente',fecha:c.fecha||''})} }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                  <span style={{fontSize:13,fontWeight:400,color:'var(--ink)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.concepto}</span>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--ink)',flexShrink:0}}>${Number(c.monto||0).toLocaleString('es-MX')}</span>
                  <span className={`chip chip-${c.estatus==='Pagado'?'green':c.estatus==='Parcial'?'warn':'red'}`} style={{flexShrink:0}}>{c.estatus}</span>
                  <span style={{fontSize:11,color:'var(--g400)',flexShrink:0}}>{editingCost===i?'▲':'✏️'}</span>
                </div>
                {editingCost===i && (
                  <div onClick={e=>e.stopPropagation()} style={{marginTop:12,borderTop:'1px solid var(--border)',paddingTop:12}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 16px',marginBottom:10}}>
                      <div style={{gridColumn:'1/-1'}}>
                        <label className="form-label" style={{marginBottom:4,display:'block'}}>Concepto</label>
                        <input style={inputStyle} value={costoForm.concepto} onChange={e=>setCostoForm(f=>({...f,concepto:e.target.value}))}/>
                      </div>
                      <div>
                        <label className="form-label" style={{marginBottom:4,display:'block'}}>Categoría</label>
                        <select style={selectStyle} value={costoForm.categoria} onChange={e=>setCostoForm(f=>({...f,categoria:e.target.value}))}>{['Material','Mano de obra','Equipo','Honorarios','Otro'].map(o=><option key={o}>{o}</option>)}</select>
                      </div>
                      <div>
                        <label className="form-label" style={{marginBottom:4,display:'block'}}>Monto MXN</label>
                        <input style={inputStyle} type="number" value={costoForm.monto} onChange={e=>setCostoForm(f=>({...f,monto:e.target.value}))}/>
                      </div>
                      <div>
                        <label className="form-label" style={{marginBottom:4,display:'block'}}>Estatus</label>
                        <select style={selectStyle} value={costoForm.estatus} onChange={e=>setCostoForm(f=>({...f,estatus:e.target.value}))}>{['Pagado','Parcial','Pendiente'].map(o=><option key={o}>{o}</option>)}</select>
                      </div>
                      <div>
                        <label className="form-label" style={{marginBottom:4,display:'block'}}>Fecha</label>
                        <input style={inputStyle} type="date" value={costoForm.fecha} onChange={e=>setCostoForm(f=>({...f,fecha:e.target.value}))}/>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <button onClick={async()=>{
                        const updated = costsDB.map((x,idx)=>idx===i?{...x,...costoForm,monto:parseInt(costoForm.monto)||0}:x)
                        const ok = await api({costs:updated})
                        if(ok){setEditingCost(null);showToast('Gasto actualizado ✓')}
                      }} style={{padding:'8px 18px',background:'var(--ink)',color:'var(--white)',border:'none',fontFamily:'Jost,sans-serif',fontSize:11,cursor:'pointer',letterSpacing:'.06em',textTransform:'uppercase',borderRadius:BTN_RADIUS}} disabled={saving}>
                        Guardar cambios
                      </button>
                      <button onClick={async()=>{
                        if(!confirm('¿Eliminar este gasto?')) return
                        const ok = await api({costs:costsDB.filter((_,idx)=>idx!==i)})
                        if(ok){setEditingCost(null);showToast('Gasto eliminado')}
                      }} style={{padding:'8px 14px',background:'transparent',border:'1px solid var(--danger)',color:'var(--danger)',fontFamily:'Jost,sans-serif',fontSize:11,cursor:'pointer',borderRadius:BTN_RADIUS}} disabled={saving}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Nuevo gasto */}
        <div style={{borderTop:costsDB.length>0?'1px solid var(--border)':'none',paddingTop:costsDB.length>0?16:0}}>
          <div style={{fontSize:10,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--gold)',fontWeight:600,marginBottom:12}}>Agregar nuevo gasto</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:12}}>
            <div style={{gridColumn:'1/-1'}}>
              <label className="form-label" style={{marginBottom:6,display:'block'}}>Concepto</label>
              <input style={inputStyle} placeholder="Ej. Acero para cimentación" value={editingCost===null?costoForm.concepto:''} onChange={e=>{ setEditingCost(null); setCostoForm(f=>({...f,concepto:e.target.value})) }}/>
            </div>
            <div>
              <label className="form-label" style={{marginBottom:6,display:'block'}}>Categoría</label>
              <select style={selectStyle} value={costoForm.categoria} onChange={e=>setCostoForm(f=>({...f,categoria:e.target.value}))}>{['Material','Mano de obra','Equipo','Honorarios','Otro'].map(o=><option key={o}>{o}</option>)}</select>
            </div>
            <div>
              <label className="form-label" style={{marginBottom:6,display:'block'}}>Monto MXN</label>
              <input style={inputStyle} type="number" placeholder="0" value={editingCost===null?costoForm.monto:''} onChange={e=>{ setEditingCost(null); setCostoForm(f=>({...f,monto:e.target.value})) }}/>
            </div>
            <div>
              <label className="form-label" style={{marginBottom:6,display:'block'}}>Estatus</label>
              <select style={selectStyle} value={costoForm.estatus} onChange={e=>setCostoForm(f=>({...f,estatus:e.target.value}))}>{['Pagado','Parcial','Pendiente'].map(o=><option key={o}>{o}</option>)}</select>
            </div>
            <div>
              <label className="form-label" style={{marginBottom:6,display:'block'}}>Fecha</label>
              <input style={inputStyle} type="date" value={costoForm.fecha} onChange={e=>setCostoForm(f=>({...f,fecha:e.target.value}))}/>
            </div>
          </div>
          <button className="btn-submit" style={{...btnSubmitStyle, maxWidth:180}} disabled={saving||!costoForm.concepto||editingCost!==null} onClick={async()=>{
            const newCosts=[...costsDB,{...costoForm,monto:parseInt(costoForm.monto)||0}]
            const ok=await api({costs:newCosts})
            if(ok){setCostoForm({concepto:'',categoria:'Material',etapa:'',monto:'',estatus:'Pendiente',fecha:''});showToast('Gasto registrado ✓')}
          }}>Agregar gasto</button>
        </div>
      </SectionCard>

      {/* ── MI CUENTA ────────────────────────────────── */}
      <SectionCard autoSaving={autoSaving} sectionRef={el => sectionRefs.current["cuenta"] = el} id="cuenta" title="Mi cuenta">
        <div style={{marginBottom:20}}>
          <label className="form-label" style={{marginBottom:6,display:'block'}}>Nombre completo</label>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <input style={{...inputStyle,flex:1,minWidth:200}} value={accountName} onChange={e=>setAccountName(e.target.value)}/>
            <button className="btn-submit" style={{...btnSubmitStyle, maxWidth:180, marginTop:0, flexShrink:0}} disabled={savingAccount||!accountName.trim()} onClick={async()=>{
              setSavingAccount(true)
              try {
                const res = await fetch('/api/auth/update-account', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:user.id, name:accountName.trim() }) })
                if(res.ok) showToast('Nombre actualizado ✓')
                else showToast('Error al actualizar')
              } catch { showToast('Error al actualizar') }
              finally { setSavingAccount(false) }
            }}>Guardar nombre</button>
          </div>
        </div>
        <div style={{borderTop:'1px solid var(--border)',paddingTop:16}}>
          <label className="form-label" style={{marginBottom:12,display:'block'}}>Cambiar contraseña</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 16px',marginBottom:12}}>
            <div>
              <label className="form-label" style={{marginBottom:6,display:'block'}}>Nueva contraseña</label>
              <input style={inputStyle} type="password" placeholder="Mínimo 8 caracteres" value={newPass} onChange={e=>setNewPass(e.target.value)}/>
            </div>
            <div>
              <label className="form-label" style={{marginBottom:6,display:'block'}}>Confirmar</label>
              <input style={inputStyle} type="password" placeholder="Repite la contraseña" value={newPass2} onChange={e=>setNewPass2(e.target.value)}/>
            </div>
          </div>
          {newPass && newPass!==newPass2 && <p style={{fontSize:12,color:'var(--danger)',marginBottom:8}}>Las contraseñas no coinciden</p>}
          <button className="btn-submit" style={{...btnSubmitStyle, maxWidth:220}} disabled={savingAccount||newPass.length<8||newPass!==newPass2} onClick={async()=>{
            setSavingAccount(true)
            try {
              const res = await fetch('/api/auth/update-account', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:user.id, password:newPass }) })
              if(res.ok) { showToast('Contraseña actualizada ✓'); setNewPass(''); setNewPass2('') }
              else showToast('Error al cambiar contraseña')
            } catch { showToast('Error') }
            finally { setSavingAccount(false) }
          }}>Cambiar contraseña</button>
        </div>
      </SectionCard>

      </div>

      {toast && (
        <div style={{position:'fixed',bottom:32,left:'50%',transform:'translateX(-50%)',background:toast.isError?'#7A0000':'var(--ink)',color:'var(--white)',padding:'12px 20px',fontSize:13,fontWeight:300,zIndex:9999,boxShadow:'0 8px 24px rgba(0,0,0,.2)',display:'flex',alignItems:'center',gap:12,maxWidth:'90vw',borderRadius:8}}>
          <span>{toast.msg||toast}</span>
          {toast.isError && toast.retryBody && (
            <button onClick={async()=>{ setToast(''); await api(toast.retryBody) }} style={{background:'rgba(255,255,255,.2)',border:'1px solid rgba(255,255,255,.3)',color:'#fff',padding:'4px 12px',fontFamily:'Jost,sans-serif',fontSize:11,cursor:'pointer',letterSpacing:'.06em',textTransform:'uppercase',flexShrink:0,borderRadius:BTN_RADIUS}}>Reintentar</button>
          )}
          <button onClick={()=>setToast('')} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',fontSize:16,cursor:'pointer',flexShrink:0}}>✕</button>
        </div>
      )}

      </div>
    </div>
  )
}
