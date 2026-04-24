'use client'
import { useState, useEffect, useRef } from 'react'
import { sendAuthRequestEmail, sendAuthResponseEmail } from '@/lib/emailjs'
import { uploadToApiWithRetry } from '@/lib/uploadWithRetry'

// ===== Constantes visuales =====
const CARD_RADIUS = 12
const INPUT_RADIUS = 6
const BTN_RADIUS = 6

// ===== Íconos SVG =====
const IconStamp = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11V7a3 3 0 0 1 6 0v4"/>
    <path d="M5 14h14l-1.5 5.5A2 2 0 0 1 15.5 21h-7a2 2 0 0 1-2-1.5L5 14z"/>
    <line x1="3" y1="14" x2="21" y2="14"/>
  </svg>
)
const IconPlus = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconEmpty = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11V7a3 3 0 0 1 6 0v4"/>
    <path d="M5 14h14l-1.5 5.5A2 2 0 0 1 15.5 21h-7a2 2 0 0 1-2-1.5L5 14z"/>
    <line x1="3" y1="14" x2="21" y2="14"/>
  </svg>
)

export default function Autorizaciones({ project, user, isArq, onCountChange }) {
  const proj = (project && project.project) ? project.project : (project || {})
  const projectId    = proj?.id
  const projectName  = proj?.nombre       || 'Tu proyecto'
  const clientName   = proj?.cliente      || 'Cliente'
  const clientEmail  = proj?.client_email || proj?.cliente_email || ''

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formPhoto, setFormPhoto] = useState(null)
  const [formPreview, setFormPreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [respondingId, setRespondingId] = useState(null)
  const [observations, setObservations] = useState({})
  const [lightbox, setLightbox] = useState(null)
  const [retryMsg, setRetryMsg] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (projectId) {
      loadItems()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const loadItems = async () => {
    if (!projectId) { setLoading(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/authorizations?project_id=${projectId}`)
      const data = await res.json()
      if (res.ok) {
        const list = data.authorizations || []
        setItems(list)
        if (onCountChange) {
          onCountChange(list.filter(a => a.status === 'pending').length)
        }
      } else {
        console.error('Error al cargar autorizaciones:', data.error)
      }
    } catch (e) {
      console.error('Error cargando autorizaciones:', e)
    } finally {
      setLoading(false)
    }
  }

  const compressImage = (file, maxWidth = 1200, quality = 0.8) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          if (width > maxWidth) {
            height = (maxWidth / width) * height
            width = maxWidth
          }
          canvas.width = width
          canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Compresión falló'))),
            'image/jpeg',
            quality
          )
        }
        img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
        img.src = e.target.result
      }
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
      reader.readAsDataURL(file)
    })

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Selecciona una imagen válida'); return }
    try {
      const compressed = await compressImage(file)
      setFormPhoto(compressed)
      setFormPreview(URL.createObjectURL(compressed))
    } catch (err) {
      alert('Error procesando la imagen: ' + err.message)
    }
  }

  const removePhoto = () => {
    setFormPhoto(null)
    setFormPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const resetForm = () => {
    setFormTitle(''); setFormMessage(''); setFormPhoto(null); setFormPreview(null)
    setShowForm(false); setUploadProgress(0); setRetryMsg('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmitRequest = async () => {
    if (!formTitle.trim()) { alert('El título es obligatorio'); return }
    if (!projectId) { alert('No se encontró el proyecto. Recarga la página.'); return }
    setSubmitting(true)
    try {
      let photo_url = null
      if (formPhoto) {
        try {
          const upData = await uploadToApiWithRetry(
            formPhoto,
            { projectId, bucket: 'project-photos' },
            {
              onProgress: (pct) => setUploadProgress(pct),
              onRetry: (attempt, max) => {
                setRetryMsg(`Conexión inestable, reintentando (${attempt}/${max})…`)
                setTimeout(() => setRetryMsg(''), 3000)
              },
              timeoutMs: 60000,
              maxRetries: 3,
            }
          )
          photo_url = upData.url
        } catch (uploadErr) {
          throw new Error('No se pudo subir la foto. Revisa tu conexión e intenta de nuevo.')
        }
      }

      setUploadProgress(90)
      const res = await fetch('/api/authorizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          title: formTitle.trim(),
          message: formMessage.trim(),
          photo_url,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error creando la solicitud')

      try {
        await sendAuthRequestEmail({
          clientEmail,
          arquitectoNombre: user.name || user.email,
          arquitectoEmail: user.email,
          proyecto: projectName,
          cliente: clientName,
          titulo: formTitle.trim(),
          mensaje: formMessage.trim(),
        })
      } catch (emailErr) {
        console.warn('Email al cliente no enviado:', emailErr)
      }

      setUploadProgress(100)
      resetForm()
      loadItems()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
      setTimeout(() => { setUploadProgress(0); setRetryMsg('') }, 400)
    }
  }

  const handleRespond = async (auth, decision) => {
    if (respondingId) return
    setRespondingId(auth.id)
    try {
      const res = await fetch('/api/authorizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: auth.id,
          status: decision,
          client_observations: observations[auth.id] || '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error respondiendo')

      if (data.architect_email) {
        try {
          await sendAuthResponseEmail({
            arquitectoEmail: data.architect_email,
            clienteNombre: clientName || user.name || 'Cliente',
            clienteEmail: clientEmail || user.email || '',
            proyecto: projectName,
            titulo: auth.title,
            decision,
            observaciones: observations[auth.id] || '',
          })
        } catch (emailErr) {
          console.warn('Email al arquitecto no enviado:', emailErr)
        }
      }

      setObservations(prev => ({ ...prev, [auth.id]: '' }))
      loadItems()
    } catch (err) {
      alert(err.message)
    } finally {
      setRespondingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/authorizations?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error eliminando')
      }
      loadItems()
    } catch (err) {
      alert(err.message)
    }
  }

  const pending = items.filter(a => a.status === 'pending')
  const responded = items.filter(a => a.status !== 'pending')
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }) : ''

  if (loading) {
    return (
      <div style={{ padding:'80px 0', textAlign:'center', color:'var(--g400)', fontSize:14, fontWeight:300 }}>
        Cargando autorizaciones…
      </div>
    )
  }

  if (!projectId) {
    return (
      <div style={{ padding:'80px 0', textAlign:'center', color:'var(--g400)', fontSize:14, fontWeight:300 }}>
        No se pudo cargar la información del proyecto. Recarga la página.
      </div>
    )
  }

  const inputStyle = {
    width:'100%',
    padding:'12px 14px',
    border:'1px solid var(--border)',
    borderRadius: INPUT_RADIUS,
    fontFamily:'Jost, sans-serif',
    fontSize:13,
    fontWeight:400,
    color:'var(--ink)',
    outline:'none',
    boxSizing:'border-box',
    background:'var(--white)',
  }
  const textareaStyle = { ...inputStyle, resize:'vertical', lineHeight:1.6 }

  return (
    <div>
      <style>{`
        .auth-root .card { border-radius: ${CARD_RADIUS}px !important; overflow: hidden; }
        .auth-root .section-hero { border-radius: ${CARD_RADIUS}px !important; overflow: hidden; }
      `}</style>

      <div className="auth-root">

      {/* HERO */}
      <div className="section-hero" style={{marginBottom:20}}>
        <div className="section-hero-eyebrow" style={{color:'var(--gold)',fontWeight:500}}>Proyecto · Decisiones</div>
        <h1 className="section-hero-title">
          {isArq ? 'Autorizaciones' : 'Elementos por autorizar'}
        </h1>
        <p className="section-hero-sub">
          {pending.length} pendiente{pending.length!==1?'s':''} · {responded.length} respondida{responded.length!==1?'s':''}
        </p>
      </div>

      {/* Barra de acciones del arquitecto */}
      {isArq && (
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
          <button onClick={() => setShowForm(!showForm)}
            style={{
              display:'inline-flex',
              alignItems:'center',
              gap:8,
              padding:'10px 20px',
              background: showForm ? 'var(--white)' : 'var(--ink)',
              color: showForm ? 'var(--ink)' : 'var(--white)',
              border: showForm ? '1px solid var(--border)' : '1px solid var(--ink)',
              borderRadius: BTN_RADIUS,
              fontFamily:'Jost, sans-serif',
              fontSize:11,
              fontWeight:600,
              letterSpacing:'.1em',
              textTransform:'uppercase',
              cursor:'pointer',
              transition:'all .15s',
            }}>
            {showForm ? 'Cancelar' : <><IconPlus /> Nueva solicitud</>}
          </button>
        </div>
      )}

      {/* Formulario (arquitecto) */}
      {isArq && showForm && (
        <div className="card" style={{marginBottom:16, padding:24}}>
          <div className="card-title" style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{color:'var(--gold)',display:'inline-flex',flexShrink:0}}><IconStamp /></span>
            <span>Nueva solicitud de autorización</span>
          </div>

          <div style={{ marginBottom:16, marginTop:4 }}>
            <label style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--g400)', marginBottom:6, display:'block', fontWeight:500 }}>Título *</label>
            <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} maxLength={200} placeholder="Ej. Color de loseta sala"
              style={inputStyle} />
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--g400)', marginBottom:6, display:'block', fontWeight:500 }}>Mensaje al cliente</label>
            <textarea value={formMessage} onChange={e => setFormMessage(e.target.value)} rows={4} maxLength={2000}
              placeholder="Esta es la propuesta de color que sugiero, tiene tonos cálidos que combinan con la cocina…"
              style={textareaStyle} />
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--g400)', marginBottom:6, display:'block', fontWeight:500 }}>Foto (opcional)</label>
            {formPreview ? (
              <div style={{ position:'relative', display:'inline-block' }}>
                <img src={formPreview} alt="Preview" style={{ maxWidth:240, maxHeight:240, border:'1px solid var(--border)', display:'block', borderRadius:8 }} />
                <button onClick={removePhoto}
                  style={{ position:'absolute', top:6, right:6, width:28, height:28, background:'rgba(0,0,0,.75)', color:'#fff', border:'none', cursor:'pointer', fontSize:14, lineHeight:1, borderRadius:'50%' }}>×</button>
              </div>
            ) : (
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange}
                style={{ fontFamily:'Jost, sans-serif', fontSize:12, color:'var(--g500)' }} />
            )}
          </div>

          {uploadProgress > 0 && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <span style={{ fontSize:11, color:'var(--g500)', fontWeight:300 }}>
                  {retryMsg || (uploadProgress < 100 ? `Subiendo… ${uploadProgress}%` : 'Listo')}
                </span>
                <span style={{ fontSize:11, color:retryMsg ? 'var(--gold)' : 'var(--g400)' }}>{uploadProgress}%</span>
              </div>
              <div style={{ height:4, background:'var(--g100)', marginBottom:16, overflow:'hidden', borderRadius:2 }}>
                <div style={{ height:'100%', background: retryMsg ? 'var(--gold)' : 'var(--ink)', width:`${uploadProgress}%`, transition:'width .3s' }} />
              </div>
            </>
          )}

          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={resetForm} disabled={submitting}
              style={{ padding:'10px 22px', background:'transparent', border:'1px solid var(--border)', borderRadius:BTN_RADIUS, fontFamily:'Jost, sans-serif', fontSize:11, color:'var(--g500)', cursor:'pointer', letterSpacing:'.08em', textTransform:'uppercase' }}>
              Cancelar
            </button>
            <button onClick={handleSubmitRequest} disabled={submitting || !formTitle.trim()}
              style={{
                padding:'10px 22px',
                background: submitting || !formTitle.trim() ? 'var(--g200)' : 'var(--ink)',
                color: submitting || !formTitle.trim() ? 'var(--g400)' : 'var(--white)',
                border:'none', borderRadius:BTN_RADIUS, fontFamily:'Jost, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.1em',
                textTransform:'uppercase', cursor: submitting || !formTitle.trim() ? 'not-allowed' : 'pointer'
              }}>
              {submitting ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="card" style={{padding:'64px 24px', textAlign:'center'}}>
          <div style={{color:'var(--g300)',marginBottom:14,display:'inline-flex'}}><IconEmpty /></div>
          <p style={{fontSize:15,fontWeight:400,color:'var(--g500)',marginBottom:6}}>
            {isArq ? 'Sin solicitudes de autorización' : 'Sin elementos pendientes'}
          </p>
          <p style={{fontSize:12,color:'var(--g400)',fontWeight:300}}>
            {isArq ? 'Crea tu primera solicitud para empezar.' : 'Cuando el arquitecto te pida una autorización, aparecerá aquí.'}
          </p>
        </div>
      )}

      {/* Pendientes */}
      {pending.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:10, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--gold)', fontWeight:600, marginBottom:12 }}>
            Pendientes · {pending.length}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {pending.map(auth => (
              <AuthCard key={auth.id} auth={auth} isArq={isArq} formatDate={formatDate}
                observations={observations} setObservations={setObservations}
                onRespond={handleRespond} onDelete={handleDelete}
                respondingId={respondingId} onImageClick={setLightbox} />
            ))}
          </div>
        </div>
      )}

      {/* Historial con scroll interno si >6 */}
      {responded.length > 0 && (
        <div>
          <p style={{ fontSize:10, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--g400)', fontWeight:600, marginBottom:12 }}>
            Historial · {responded.length}
          </p>
          <div style={{
            display:'flex', flexDirection:'column', gap:12,
            maxHeight: responded.length > 6 ? 720 : 'none',
            overflowY: responded.length > 6 ? 'auto' : 'visible',
            paddingRight: responded.length > 6 ? 6 : 0,
          }}>
            {responded.map(auth => (
              <AuthCard key={auth.id} auth={auth} isArq={isArq} formatDate={formatDate}
                observations={observations} setObservations={setObservations}
                onRespond={handleRespond} onDelete={handleDelete}
                respondingId={respondingId} onImageClick={setLightbox} />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, cursor:'pointer' }}>
          <img src={lightbox} alt="Foto" style={{ maxWidth:'92vw', maxHeight:'92vh', objectFit:'contain', borderRadius:CARD_RADIUS }} />
        </div>
      )}

      </div>
    </div>
  )
}

// ========== Sub-componente: tarjeta de autorización ==========
function AuthCard({ auth, isArq, formatDate, observations, setObservations, onRespond, onDelete, respondingId, onImageClick }) {
  const isPending = auth.status === 'pending'

  const statusStyle = {
    pending:  { label:'Pendiente',     color:'#8A6D00', bg:'#FBF4E0', border:'#E8D9A0' },
    approved: { label:'Autorizado',    color:'#1F5E3C', bg:'#E8F2EB', border:'#B8D6C2' },
    rejected: { label:'No autorizado', color:'#8A2020', bg:'#F8E4E4', border:'#D9B0B0' },
  }[auth.status]

  return (
    <div style={{
      background:'var(--white)',
      border:'1px solid var(--border)',
      borderRadius: CARD_RADIUS,
      padding:'22px 24px',
      borderLeft: isPending ? '3px solid var(--gold)' : '1px solid var(--border)',
      transition:'border-color .2s, box-shadow .2s',
    }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, gap:12, flexWrap:'wrap' }}>
        <div style={{ flex:'1 1 200px', minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:9, letterSpacing:'.14em', textTransform:'uppercase', color:statusStyle.color, background:statusStyle.bg, border:`1px solid ${statusStyle.border}`, padding:'3px 10px', fontWeight:600, borderRadius:999 }}>
              {statusStyle.label}
            </span>
            <span style={{ fontSize:11, color:'var(--g400)', fontWeight:300 }}>{formatDate(auth.created_at)}</span>
          </div>
          <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:400, color:'var(--ink)', margin:0, lineHeight:1.25 }}>
            {auth.title}
          </h3>
        </div>
        {isArq && (
          <button onClick={() => onDelete(auth.id)}
            style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:BTN_RADIUS, padding:'5px 12px', fontFamily:'Jost, sans-serif', fontSize:10, color:'var(--g400)', cursor:'pointer', letterSpacing:'.08em', textTransform:'uppercase' }}>
            Eliminar
          </button>
        )}
      </div>

      {/* Mensaje */}
      {auth.message && (
        <p style={{ fontSize:14, fontWeight:400, color:'var(--ink)', lineHeight:1.65, margin:'0 0 14px', whiteSpace:'pre-wrap' }}>
          {auth.message}
        </p>
      )}

      {/* Foto */}
      {auth.photo_url && (
        <div style={{ marginBottom:14 }}>
          <img src={auth.photo_url} alt={auth.title} onClick={() => onImageClick(auth.photo_url)}
            style={{ maxWidth:'100%', maxHeight:320, border:'1px solid var(--border)', cursor:'zoom-in', display:'block', borderRadius:8 }} />
        </div>
      )}

      {/* Observaciones ya respondidas */}
      {!isPending && auth.client_observations && (
        <div style={{ background:'var(--off)', borderLeft:`3px solid ${statusStyle.color}`, padding:'14px 16px', marginBottom:8, borderRadius:6 }}>
          <p style={{ fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--gold)', fontWeight:600, margin:'0 0 6px' }}>
            Observaciones del cliente
          </p>
          <p style={{ fontSize:14, fontWeight:400, color:'var(--ink)', margin:0, whiteSpace:'pre-wrap', lineHeight:1.65 }}>
            {auth.client_observations}
          </p>
        </div>
      )}

      {!isPending && auth.responded_at && (
        <p style={{ fontSize:11, color:'var(--g400)', fontWeight:300, margin:'8px 0 0' }}>
          Respondido el {formatDate(auth.responded_at)}
        </p>
      )}

      {/* Acciones del cliente */}
      {isPending && !isArq && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)' }}>
          <label style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--g400)', marginBottom:6, display:'block', fontWeight:500 }}>
            Observaciones (opcional)
          </label>
          <textarea value={observations[auth.id] || ''} onChange={e => setObservations(prev => ({ ...prev, [auth.id]: e.target.value }))}
            rows={3} maxLength={2000} placeholder="Ej. Me gustaría un color más claro…"
            style={{ width:'100%', padding:12, border:'1px solid var(--border)', borderRadius:INPUT_RADIUS, fontFamily:'Jost, sans-serif', fontSize:13, fontWeight:400, color:'var(--ink)', outline:'none', resize:'vertical', lineHeight:1.6, boxSizing:'border-box', background:'var(--white)', marginBottom:12 }} />
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={() => onRespond(auth, 'approved')} disabled={respondingId === auth.id}
              style={{
                flex:'1 1 140px', padding:'11px 20px',
                background: respondingId === auth.id ? 'var(--g200)' : 'var(--ink)',
                color: respondingId === auth.id ? 'var(--g400)' : 'var(--white)',
                border:'none', borderRadius:BTN_RADIUS, fontFamily:'Jost, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase',
                cursor: respondingId === auth.id ? 'not-allowed' : 'pointer'
              }}>
              {respondingId === auth.id ? 'Enviando…' : '✓ Autorizar'}
            </button>
            <button onClick={() => onRespond(auth, 'rejected')} disabled={respondingId === auth.id}
              style={{
                flex:'1 1 140px', padding:'11px 20px', background:'transparent',
                color:'#8A2020', border:'1px solid #8A2020', borderRadius:BTN_RADIUS,
                fontFamily:'Jost, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase',
                cursor: respondingId === auth.id ? 'not-allowed' : 'pointer',
                opacity: respondingId === auth.id ? .5 : 1
              }}>
              ✕ No autorizar
            </button>
          </div>
        </div>
      )}

      {/* Estado arquitecto cuando pendiente */}
      {isPending && isArq && (
        <p style={{ fontSize:12, color:'var(--g400)', fontStyle:'italic', fontWeight:300, margin:'8px 0 0' }}>
          Esperando respuesta del cliente…
        </p>
      )}
    </div>
  )
}
