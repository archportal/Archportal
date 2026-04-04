'use client'
import { useState, useEffect } from 'react'

const EMAILJS_SERVICE  = 'service_y8oqc0d'
const EMAILJS_TEMPLATE = 'template_w05m1ot'
const EMAILJS_PUBLIC   = '7rTOKqMzkk2FuOzSV'

export default function MasterPanel({ onImpersonate, onLogout }) {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [apiKey, setApiKey]     = useState('')
  const [apiSaved, setApiSaved] = useState(false)

  // Broadcast
  const [bSubject, setBSubject] = useState('')
  const [bMessage, setBMessage] = useState('')
  const [bFilter,  setBFilter]  = useState('todos')
  const [bSending, setBSending] = useState(false)
  const [bResult,  setBResult]  = useState(null)

  // Crear acceso
  const [showCreate, setShowCreate] = useState(false)
  const [cForm, setCForm] = useState({ nombre:'', email:'', password:'' })
  const [cLoading, setCLoading] = useState(false)
  const [cError, setCError]   = useState('')
  const [cSuccess, setCSuccess] = useState('')

  useEffect(() => {
    fetch('/api/master').then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false) })
    const saved = localStorage.getItem('master_anthropic_key') || ''
    setApiKey(saved)
  }, [])

  const saveApiKey = () => {
    localStorage.setItem('master_anthropic_key', apiKey.trim())
    setApiSaved(true)
    setTimeout(() => setApiSaved(false), 2500)
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString('es-MX') : '—'

  const recipients = users.filter(u => {
    if (u.role !== 'arq') return false
    if (bFilter === 'todos') return true
    return u.plan === bFilter
  })

  const loadEmailJS = () => new Promise((res, rej) => {
    const existing = document.getElementById('emailjs-sdk')
    if (existing) existing.remove()
    const s = document.createElement('script')
    s.id = 'emailjs-sdk'
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
    s.onload = () => { window.emailjs.init({ publicKey: EMAILJS_PUBLIC }); res() }
    s.onerror = rej
    document.head.appendChild(s)
  })

  const sendBroadcast = async () => {
    if (!bSubject.trim() || !bMessage.trim() || recipients.length === 0) return
    setBSending(true); setBResult(null)
    try { await loadEmailJS() } catch (e) {
      setBSending(false); setBResult({ ok: false, sent: 0, failed: recipients.length }); return
    }
    let sent = 0, failed = 0
    for (const u of recipients) {
      try {
        await window.emailjs.send(EMAILJS_SERVICE, 'template_jznns8p', {
          to_email: u.email, to_name: u.name || u.email,
          email: u.email, subject: bSubject, message: bMessage,
        })
        sent++
      } catch (err) { console.error('EmailJS error:', u.email, JSON.stringify(err)); failed++ }
      await new Promise(r => setTimeout(r, 400))
    }
    setBSending(false); setBResult({ ok: failed === 0, sent, failed })
    if (failed === 0) { setBSubject(''); setBMessage('') }
  }

  const createUser = async () => {
    setCError(''); setCSuccess('')
    if (!cForm.nombre.trim() || !cForm.email.trim() || !cForm.password.trim()) {
      setCError('Completa todos los campos'); return
    }
    if (cForm.password.length < 8) { setCError('La contraseña debe tener al menos 8 caracteres'); return }
    setCLoading(true)
    try {
      const res = await fetch('/api/master/create-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cForm)
      })
      const data = await res.json()
      if (!res.ok) { setCError(data.error); return }

      // Enviar correo de bienvenida con credenciales
      try {
        await loadEmailJS()
        await window.emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
          nombre: cForm.nombre, email: cForm.email, password: cForm.password
        })
      } catch(e) { console.warn('EmailJS welcome:', e) }

      setCSuccess(`Acceso creado para ${cForm.email} con Plan Anual`)
      setCForm({ nombre:'', email:'', password:'' })
      // Refrescar lista
      fetch('/api/master').then(r => r.json()).then(d => setUsers(d.users || []))
    } catch(e) { setCError('Error al crear el acceso') }
    finally { setCLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)' }}>
      <div style={{ background: 'var(--ink)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 400, color: 'var(--white)' }}>
          ArchPortal <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginLeft: 12 }}>Panel Maestro</span>
        </div>
        <button onClick={onLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,.2)', padding: '6px 16px', fontFamily: 'Jost, sans-serif', fontSize: 11, color: 'rgba(255,255,255,.6)', cursor: 'pointer', letterSpacing: '.08em', textTransform: 'uppercase' }}>Salir</button>
      </div>

      <div style={{ padding: '48px 32px', maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--g400)', marginBottom: 8 }}>Panel maestro</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, color: 'var(--ink)' }}>Suscriptores</h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--border)', marginBottom: 32 }}>
          {[
            ['Total usuarios', users.length],
            ['Arquitectos', users.filter(u=>u.role==='arq').length],
            ['Plan mensual', users.filter(u=>u.plan==='mensual').length],
            ['Plan anual', users.filter(u=>u.plan==='anual').length],
          ].map(([label,val])=>(
            <div key={label} style={{ background: 'var(--white)', padding: '24px 28px' }}>
              <div style={{ fontSize: 9, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--g400)', marginBottom: 12 }}>{label}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: 'var(--ink)' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* API Key */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-title">Configuración de IA</div>
          <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--g500)', lineHeight: 1.7, marginBottom: 20 }}>
            Esta API Key de Anthropic será utilizada por el asistente de soporte en todos los proyectos de la plataforma.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--g400)', marginBottom: 8, display: 'block' }}>Anthropic API Key</label>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-api03-..." style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '1.5px solid var(--border)', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 300, background: 'transparent', color: 'var(--ink)', outline: 'none' }} />
            </div>
            <button onClick={saveApiKey} style={{ padding: '12px 28px', background: 'var(--ink)', color: 'var(--white)', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {apiSaved ? '✓ Guardado' : 'Guardar key'}
            </button>
          </div>
          {apiKey && <p style={{ fontSize: 11, color: 'var(--g400)', marginTop: 10 }}>Key activa: {apiKey.substring(0, 16)}...</p>}
        </div>

        {/* ── CREAR ACCESO ─────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: showCreate ? 24 : 0 }}>
            <div>
              <div className="card-title" style={{ marginBottom: 4 }}>Crear acceso</div>
              {!showCreate && <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--g500)', margin: 0 }}>Otorga acceso a un correo con Plan Anual sin pasar por el registro.</p>}
            </div>
            <button onClick={() => { setShowCreate(!showCreate); setCError(''); setCSuccess('') }} style={{ padding: '8px 20px', background: showCreate ? 'transparent' : 'var(--ink)', color: showCreate ? 'var(--g500)' : 'var(--white)', border: '1px solid var(--border)', fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {showCreate ? 'Cancelar' : '+ Nuevo acceso'}
            </button>
          </div>

          {showCreate && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px', marginBottom: 20 }}>
                {[
                  ['nombre', 'Nombre completo', 'Arq. Juan Torres'],
                  ['email',  'Correo electrónico', 'juan@despacho.mx'],
                  ['password', 'Contraseña', 'Mínimo 8 caracteres'],
                ].map(([key, label, ph]) => (
                  <div key={key} className="form-field">
                    <label className="form-label">{label}</label>
                    <input
                      type={key === 'password' ? 'password' : 'text'}
                      className="form-input"
                      placeholder={ph}
                      value={cForm[key]}
                      onChange={e => setCForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px 16px', background: '#EBF2E4', borderLeft: '3px solid #2D5016', marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: '#2D5016', margin: 0 }}>Este acceso tendrá <strong>Plan Anual</strong> — hasta 20 proyectos activos.</p>
              </div>

              {cError   && <p style={{ fontSize: 12, color: '#B83232', marginBottom: 12, padding: '10px 14px', background: '#FBE4E4' }}>{cError}</p>}
              {cSuccess && <p style={{ fontSize: 12, color: '#2D5016', marginBottom: 12, padding: '10px 14px', background: '#EBF2E4' }}>✓ {cSuccess}</p>}

              <button onClick={createUser} disabled={cLoading} style={{ padding: '12px 32px', background: cLoading ? 'var(--g200)' : 'var(--ink)', color: cLoading ? 'var(--g400)' : 'var(--white)', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', cursor: cLoading ? 'not-allowed' : 'pointer' }}>
                {cLoading ? 'Creando...' : 'Crear acceso y enviar correo'}
              </button>
            </>
          )}
        </div>
        {/* ── FIN CREAR ACCESO ─────────────────────────────── */}

        {/* Comunicados */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-title">Comunicados</div>
          <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--g500)', lineHeight: 1.7, marginBottom: 24 }}>
            Envía anuncios, notificaciones o promociones a tus usuarios por correo electrónico.
          </p>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--g400)', marginBottom: 10, display: 'block' }}>Destinatarios</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { val: 'todos',   label: `Todos (${users.filter(u=>u.role==='arq').length})` },
                { val: 'mensual', label: `Plan mensual (${users.filter(u=>u.role==='arq'&&u.plan==='mensual').length})` },
                { val: 'anual',   label: `Plan anual (${users.filter(u=>u.role==='arq'&&u.plan==='anual').length})` },
              ].map(opt => (
                <button key={opt.val} onClick={() => setBFilter(opt.val)} style={{ padding: '7px 16px', fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', border: bFilter===opt.val ? '1.5px solid var(--ink)' : '1.5px solid var(--border)', background: bFilter===opt.val ? 'var(--ink)' : 'transparent', color: bFilter===opt.val ? 'var(--white)' : 'var(--g500)' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--g400)', marginBottom: 8, display: 'block' }}>Asunto</label>
            <input type="text" value={bSubject} onChange={e => setBSubject(e.target.value)} placeholder="Ej: Nuevas funciones disponibles en ArchPortal" style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '1.5px solid var(--border)', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 300, background: 'transparent', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--g400)', marginBottom: 8, display: 'block' }}>Mensaje</label>
            <textarea value={bMessage} onChange={e => setBMessage(e.target.value)} placeholder="Escribe aquí el cuerpo del mensaje..." rows={5} style={{ width: '100%', padding: '12px', border: '1.5px solid var(--border)', fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 300, background: 'transparent', color: 'var(--ink)', outline: 'none', resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box' }} />
          </div>
          {recipients.length > 0 && (
            <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--off)', borderLeft: '3px solid var(--ink)' }}>
              <p style={{ fontSize: 11, color: 'var(--g500)', margin: 0 }}>
                Se enviará a <strong style={{ color: 'var(--ink)' }}>{recipients.length} usuario{recipients.length !== 1 ? 's' : ''}</strong>:{' '}
                {recipients.slice(0,4).map(u => u.email).join(', ')}{recipients.length > 4 ? ` y ${recipients.length - 4} más…` : ''}
              </p>
            </div>
          )}
          {bResult && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: bResult.ok ? '#EBF2E4' : '#FBE9E9', borderLeft: `3px solid ${bResult.ok ? '#2D5016' : '#8B1A1A'}` }}>
              <p style={{ fontSize: 12, color: bResult.ok ? '#2D5016' : '#8B1A1A', margin: 0, fontWeight: 500 }}>
                {bResult.ok ? `✓ Enviado a ${bResult.sent} usuario${bResult.sent !== 1 ? 's' : ''}` : `⚠ Enviado: ${bResult.sent} · Fallidos: ${bResult.failed}`}
              </p>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={sendBroadcast} disabled={bSending || !bSubject.trim() || !bMessage.trim() || recipients.length === 0} style={{ padding: '12px 32px', background: (bSending || !bSubject.trim() || !bMessage.trim() || recipients.length === 0) ? 'var(--g200)' : 'var(--ink)', color: (bSending || !bSubject.trim() || !bMessage.trim() || recipients.length === 0) ? 'var(--g400)' : 'var(--white)', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
              {bSending ? 'Enviando…' : 'Enviar comunicado'}
            </button>
            {bSending && <p style={{ fontSize: 12, color: 'var(--g400)', margin: 0 }}>No cierres esta ventana.</p>}
          </div>
        </div>

        {/* Users table */}
        <div className="card">
          <div className="card-title">Usuarios activos</div>
          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--g400)', fontWeight: 300 }}>Cargando...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nombre','Email','Plan','Proyectos','Registro','Acciones'].map(h=>(
                    <th key={h} style={{ textAlign: 'left', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--g400)', padding: '8px 16px 8px 0', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.filter(u=>u.role==='arq').map((u,i)=>(
                  <tr key={u.id||i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px 14px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--g100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--g600)', flexShrink: 0 }}>
                          {(u.name||u.email||'U').split(' ').map(w=>w[0]||'').join('').substring(0,2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 300, color: 'var(--ink)' }}>{u.name || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px 14px 0', fontSize: 13, fontWeight: 300, color: 'var(--g500)' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px 14px 0' }}>
                      <span style={{ fontSize: 10, padding: '3px 8px', background: u.plan==='anual'?'#EBF2E4':u.plan==='trimestral'?'#E4EBF8':'#F0EFEC', color: u.plan==='anual'?'#2D5016':u.plan==='trimestral'?'#1A3A8B':'#6B6A62', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                        {u.plan || 'mensual'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px 14px 0', fontSize: 13, fontWeight: 300, color: 'var(--ink)', textAlign: 'center' }}>{u.project_count || 0}</td>
                    <td style={{ padding: '14px 16px 14px 0', fontSize: 12, color: 'var(--g400)' }}>{fmt(u.created_at)}</td>
                    <td style={{ padding: '14px 0' }}>
                      <button onClick={() => onImpersonate(u)} style={{ padding: '6px 14px', background: 'var(--ink)', color: 'var(--white)', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 10, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
                        Entrar como →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}
