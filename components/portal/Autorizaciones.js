'use client'
import { useState, useEffect, useRef } from 'react'
import { sendAuthRequestEmail, sendAuthResponseEmail } from '@/lib/emailjs'

export default function Autorizaciones({ project, user, isArq, onCountChange }) {
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
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (project?.id) loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id])

  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/authorizations?project_id=${project.id}`)
      const data = await res.json()
      if (res.ok) {
        const list = data.authorizations || []
        setItems(list)
        if (onCountChange) {
          onCountChange(list.filter(a => a.status === 'pending').length)
        }
      }
    } catch (e) {
      console.error('Error cargando autorizaciones:', e)
    } finally {
      setLoading(false)
    }
  }

  // Compresión Canvas nativa (mismo patrón que Admin.js)
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
    setShowForm(false); setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmitRequest = async () => {
    if (!formTitle.trim()) { alert('El título es obligatorio'); return }
    setSubmitting(true)
    try {
      let photo_url = null
      if (formPhoto) {
        setUploadProgress(25)
        const fd = new FormData()
        fd.append('file', formPhoto, `auth_${Date.now()}.jpg`)
        fd.append('projectId', project.id)
        fd.append('bucket', 'project-photos')
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        setUploadProgress(75)
        const upData = await upRes.json()
        if (!upRes.ok) throw new Error(upData.error || 'Error subiendo la foto')
        photo_url = upData.url
      }

      setUploadProgress(90)
      const res = await fetch('/api/authorizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          title: formTitle.trim(),
          message: formMessage.trim(),
          photo_url,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error creando la solicitud')

      // Email al cliente (no bloqueante)
      try {
        await sendAuthRequestEmail({
          clientEmail: project.client_email,
          arquitectoNombre: user.name || user.email,
          arquitectoEmail: user.email,
          proyecto: project.nombre || 'Tu proyecto',
          cliente: project.cliente || 'Cliente',
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
      setTimeout(() => setUploadProgress(0), 400)
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

      // Email al arquitecto (no bloqueante)
      if (data.architect_email) {
        try {
          await sendAuthResponseEmail({
            arquitectoEmail: data.architect_email,
            clienteNombre: project.cliente || user.name || 'Cliente',
            clienteEmail: project.client_email || user.email || '',
            proyecto: project.nombre || 'Tu proyecto',
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
    return <div style={{ padding:'80px 0', textAlign:'center', color:'var(--g400)', fontSize:14, fontWeight:300 }}>Cargando autorizaciones…</div>
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32, flexWrap:'wrap', gap:16 }}>
        <div>
          <p style={{ fontSize:10, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--g400)', marginBottom:8 }}>Autorizaciones</p>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:44, fontWeight:300, color:'var(--ink)', lineHeight:1.1, margin:0 }}>
            {isArq ? <>Solicita una<br/><em style={{ fontStyle:'italic' }}>autorización</em></> : <>Elementos por<br/><em style={{ fontStyle:'italic' }}>autorizar</em></>}
          </h1>
        </div>
        {isArq && (
          <button onClick={() => setShowForm(!showForm)}
            style={{
              padding:'12px 24px',
              background: showForm ? 'transparent' : 'var(--ink)',
              color: showForm ? 'var(--ink)' : 'var(--white)',
              border: showForm ? '1px solid var(--border)' : 'none',
              fontFamily:'Jost, sans-serif', fontSize:11, fontWeight:600,
              letterSpacing:'.1em', textTransform:'uppercase', cursor:'pointer'
            }}>
            {showForm ? 'Cancelar' : '+ Nueva solicitud'}
          </button>
        )}
      </div>

      {/* Formulario arquitecto */}
      {isArq && showForm && (
        <div style={{ background:'var(--white)', border:'1px solid var(--border)', padding:32, marginBottom:32 }}>
          <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, fontWeight:400, color:'var(--ink)', marginBottom:24, marginTop:0 }}>Nueva solicitud</h3>

          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--g400)', marginBottom:8, display:'block' }}>Título *</label>
            <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} maxLength={200} placeholder="Ej. Color de loseta sala"
              style={{ width:'100%', padding:12, border:'1.5px solid var(--border)', fontFamily:'Jost, sans-serif', fontSize:13, fontWeight:300, color:'var(--ink)', outline:'none', boxSizing:'border-box', background:'transparent' }} />
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--g400)', marginBottom:8, display:'block' }}>Mensaje al cliente</label>
            <textarea value={formMessage} onChange={e => setFormMessage(e.target.value)} rows={4} maxLength={2000}
              placeholder="Esta es la propuesta de color que sugiero, tiene tonos cálidos que combinan con la cocina…"
              style={{ width:'100%', padding:12, border:'1.5px solid var(--border)', fontFamily:'Jost, sans-serif', fontSize:13, fontWeight:300, color:'var(--ink)', outline:'none', resize:'vertical', lineHeight:1.7, boxSizing:'border-box', background:'transparent' }} />
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--g400)', marginBottom:8, display:'block' }}>Foto (opcional)</label>
            {formPreview ? (
              <div style={{ position:'relative', display:'inline-block' }}>
                <img src={formPreview} alt="Preview" style={{ maxWidth:240, maxHeight:240, border:'1px solid var(--border)', display:'block' }} />
                <button onClick={removePhoto}
                  style={{ position:'absolute', top:6, right:6, width:28, height:28, background:'rgba(0,0,0,.75)', color:'#fff', border:'none', cursor:'pointer', fontSize:14, lineHeight:1 }}>×</button>
              </div>
            ) : (
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange}
                style={{ fontFamily:'Jost, sans-serif', fontSize:12, color:'var(--g500)' }} />
            )}
          </div>

          {uploadProgress > 0 && (
            <div style={{ height:3, background:'var(--g100)', marginBottom:20, overflow:'hidden' }}>
              <div style={{ height:'100%', background:'var(--ink)', width:`${uploadProgress}%`, transition:'width .3s' }} />
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={resetForm} disabled={submitting}
              style={{ padding:'10px 24px', background:'transparent', border:'1px solid var(--border)', fontFamily:'Jost, sans-serif', fontSize:11, color:'var(--g500)', cursor:'pointer', letterSpacing:'.08em', textTransform:'uppercase' }}>
              Cancelar
            </button>
            <button onClick={handleSubmitRequest} disabled={submitting || !formTitle.trim()}
              style={{
                padding:'10px 24px',
                background: submitting || !formTitle.trim() ? 'var(--g200)' : 'var(--ink)',
                color: submitting || !formTitle.trim() ? 'var(--g400)' : 'var(--white)',
                border:'none', fontFamily:'Jost, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.1em',
                textTransform:'uppercase', cursor: submitting || !formTitle.trim() ? 'not-allowed' : 'pointer'
              }}>
              {submitting ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div style={{ padding:'80px 0', textAlign:'center', color:'var(--g400)', fontSize:14, fontWeight:300 }}>
          {isArq ? 'Aún no has creado solicitudes de autorización. Crea una para empezar.' : 'No hay elementos pendientes de autorización por ahora.'}
        </div>
      )}

      {/* Pendientes */}
      {pending.length > 0 && (
        <div style={{ marginBottom:40 }}>
          <p style={{ fontSize:10, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--ink)', fontWeight:600, marginBottom:16 }}>
            Pendientes · {pending.length}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
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
          <p style={{ fontSize:10, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--g400)', marginBottom:16 }}>
            Historial · {responded.length}
          </p>
          <div style={{
            display:'flex', flexDirection:'column', gap:16,
            maxHeight: responded.length > 6 ? 720 : 'none',
            overflowY: responded.length > 6 ? 'auto' : 'visible',
            paddingRight: responded.length > 6 ? 8 : 0,
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
          <img src={lightbox} alt="Foto" style={{ maxWidth:'92vw', maxHeight:'92vh', objectFit:'contain' }} />
        </div>
      )}
    </div>
  )
}

// ========== Sub-componente: tarjeta ==========

function AuthCard({ auth, isArq, formatDate, observations, setObservations, onRespond, onDelete, respondingId, onImageClick }) {
  const isPending = auth.status === 'pending'

  const statusStyle = {
    pending:  { label:'Pendiente',     color:'#8A6D00', bg:'#FBF4E0', border:'#E8D9A0' },
    approved: { label:'Autorizado',    color:'#1F5E3C', bg:'#E8F2EB', border:'#B8D6C2' },
    rejected: { label:'No autorizado', color:'#8A2020', bg:'#F8E4E4', border:'#D9B0B0' },
  }[auth.status]

  return (
    <div style={{ background:'var(--white)', border:'1px solid var(--border)', padding:24 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, gap:12, flexWrap:'wrap' }}>
        <div style={{ flex:'1 1 200px', minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:9, letterSpacing:'.12em', textTransform:'uppercase', color:statusStyle.color, background:statusStyle.bg, border:`1px solid ${statusStyle.border}`, padding:'3px 8px', fontWeight:600 }}>
              {statusStyle.label}
            </span>
            <span style={{ fontSize:11, color:'var(--g400)', fontWeight:300 }}>{formatDate(auth.created_at)}</span>
          </div>
          <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:400, color:'var(--ink)', margin:0 }}>
            {auth.title}
          </h3>
        </div>
        {isArq && (
          <button onClick={() => onDelete(auth.id)}
            style={{ background:'transparent', border:'1px solid var(--border)', padding:'5px 12px', fontFamily:'Jost, sans-serif', fontSize:10, color:'var(--g400)', cursor:'pointer', letterSpacing:'.08em', textTransform:'uppercase' }}>
            Eliminar
          </button>
        )}
      </div>

      {/* Mensaje */}
      {auth.message && (
        <p style={{ fontSize:13, fontWeight:300, color:'var(--g600)', lineHeight:1.7, margin:'0 0 14px', whiteSpace:'pre-wrap' }}>
          {auth.message}
        </p>
      )}

      {/* Foto */}
      {auth.photo_url && (
        <div style={{ marginBottom:14 }}>
          <img src={auth.photo_url} alt={auth.title} onClick={() => onImageClick(auth.photo_url)}
            style={{ maxWidth:'100%', maxHeight:320, border:'1px solid var(--border)', cursor:'zoom-in', display:'block' }} />
        </div>
      )}

      {/* Observaciones ya respondidas */}
      {!isPending && auth.client_observations && (
        <div style={{ background:'var(--off)', borderLeft:`3px solid ${statusStyle.color}`, padding:'12px 16px', marginBottom:8 }}>
          <p style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--g400)', margin:'0 0 6px' }}>
            Observaciones del cliente
          </p>
          <p style={{ fontSize:13, fontWeight:300, color:'var(--ink)', margin:0, whiteSpace:'pre-wrap', lineHeight:1.7 }}>
            {auth.client_observations}
          </p>
        </div>
      )}

      {!isPending && auth.responded_at && (
        <p style={{ fontSize:11, color:'var(--g400)', fontWeight:300, margin:'6px 0 0' }}>
          Respondido el {formatDate(auth.responded_at)}
        </p>
      )}

      {/* Acciones del cliente */}
      {isPending && !isArq && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)' }}>
          <label style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--g400)', marginBottom:8, display:'block' }}>
            Observaciones (opcional)
          </label>
          <textarea value={observations[auth.id] || ''} onChange={e => setObservations(prev => ({ ...prev, [auth.id]: e.target.value }))}
            rows={3} maxLength={2000} placeholder="Ej. Me gustaría un color más claro…"
            style={{ width:'100%', padding:12, border:'1.5px solid var(--border)', fontFamily:'Jost, sans-serif', fontSize:13, fontWeight:300, color:'var(--ink)', outline:'none', resize:'vertical', lineHeight:1.7, boxSizing:'border-box', background:'transparent', marginBottom:12 }} />
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={() => onRespond(auth, 'approved')} disabled={respondingId === auth.id}
              style={{
                flex:'1 1 140px', padding:'11px 20px',
                background: respondingId === auth.id ? 'var(--g200)' : 'var(--ink)',
                color: respondingId === auth.id ? 'var(--g400)' : 'var(--white)',
                border:'none', fontFamily:'Jost, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase',
                cursor: respondingId === auth.id ? 'not-allowed' : 'pointer'
              }}>
              {respondingId === auth.id ? 'Enviando…' : 'Autorizar'}
            </button>
            <button onClick={() => onRespond(auth, 'rejected')} disabled={respondingId === auth.id}
              style={{
                flex:'1 1 140px', padding:'11px 20px', background:'transparent',
                color:'#8A2020', border:'1px solid #8A2020',
                fontFamily:'Jost, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase',
                cursor: respondingId === auth.id ? 'not-allowed' : 'pointer',
                opacity: respondingId === auth.id ? .5 : 1
              }}>
              No autorizar
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
