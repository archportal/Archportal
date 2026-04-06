'use client'
import { useState, useCallback } from 'react'
import Dashboard from './Dashboard'
import Costos from './Costos'
import Archivos from './Archivos'
import Soporte from './Soporte'
import Cronograma from './Cronograma'
import Admin from './Admin'

const EMAILJS_SERVICE  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE
const EMAILJS_TEMPLATE = 'template_d2n23nw'
const EMAILJS_PUBLIC   = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC
const SUPPORT_EMAIL    = 'locastav11@gmail.com'

const TABS_ARQ = [
  { id:'dashboard',  es:'Dashboard',  en:'Dashboard' },
  { id:'archivos',   es:'Archivos',   en:'Files' },
  { id:'costos',     es:'Costos',     en:'Costs' },
  { id:'cronograma', es:'Cronograma', en:'Schedule' },
  { id:'soporte',    es:'Soporte',    en:'Support' },
  { id:'admin',      es:'Admin',      en:'Admin' },
]
const TABS_CLI = [
  { id:'dashboard',  es:'Dashboard',  en:'Dashboard' },
  { id:'archivos',   es:'Archivos',   en:'Files' },
  { id:'costos',     es:'Costos',     en:'Costs' },
  { id:'cronograma', es:'Cronograma', en:'Schedule' },
  { id:'soporte',    es:'Soporte',    en:'Support' },
]

const PLAN_LABELS = { mensual:'Plan Mensual', trimestral:'Plan Trimestral', anual:'Plan Anual' }
const PLAN_PRICES = { mensual:'$499 MXN / mes', trimestral:'$1,199 MXN / trimestre', anual:'$3,999 MXN / año' }
const PLAN_LIMITS = { mensual:3, trimestral:10, anual:20 }
const PLAN_ORDER  = ['mensual','trimestral','anual']

function ProfilePanel({ user, onClose }) {
  const plan = user.plan || 'mensual'
  const upgrades = PLAN_ORDER.filter(p => PLAN_ORDER.indexOf(p) > PLAN_ORDER.indexOf(plan))

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ position:'absolute', top:60, right:32, width:320, background:'var(--white)', border:'1px solid var(--border)', boxShadow:'0 8px 32px rgba(0,0,0,.1)' }}>
        {/* Header */}
        <div style={{ background:'var(--ink)', padding:'20px 24px' }}>
          <p style={{ fontSize:10, letterSpacing:'.16em', textTransform:'uppercase', color:'rgba(255,255,255,.4)', margin:'0 0 4px' }}>Mi cuenta</p>
          <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:400, color:'var(--white)', margin:0 }}>{user.name || user.email}</p>
          <p style={{ fontSize:12, fontWeight:300, color:'rgba(255,255,255,.5)', margin:'4px 0 0' }}>{user.email}</p>
        </div>

        {/* Plan actual */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
          <p style={{ fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--g400)', margin:'0 0 12px' }}>Membresía activa</p>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:400, color:'var(--ink)' }}>{PLAN_LABELS[plan] || plan}</span>
            <span style={{ fontSize:10, padding:'3px 8px', background:'#F0EFEC', color:'var(--g600)', letterSpacing:'.06em', textTransform:'uppercase' }}>{PLAN_PRICES[plan]}</span>
          </div>
          <p style={{ fontSize:12, fontWeight:300, color:'var(--g400)', margin:0 }}>
            Límite: {PLAN_LIMITS[plan] || 3} proyectos activos
          </p>
        </div>

        {/* Upgrade */}
        {upgrades.length > 0 && (
          <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
            <p style={{ fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--g400)', margin:'0 0 12px' }}>Mejorar plan</p>
            {upgrades.map(p => (
              <div key={p} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:400, color:'var(--ink)', margin:'0 0 2px' }}>{PLAN_LABELS[p]}</p>
                  <p style={{ fontSize:11, fontWeight:300, color:'var(--g400)', margin:0 }}>{PLAN_PRICES[p]} · {PLAN_LIMITS[p]} proyectos</p>
                </div>
                <button
                  onClick={() => { alert('Integración con Stripe próximamente. Por ahora escribe a soporte para cambiar tu plan.'); onClose() }}
                  style={{ padding:'6px 14px', background:'var(--ink)', color:'var(--white)', border:'none', fontFamily:'Jost, sans-serif', fontSize:10, fontWeight:500, letterSpacing:'.08em', textTransform:'uppercase', cursor:'pointer' }}>
                  Cambiar
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding:'16px 24px' }}>
          <p style={{ fontSize:11, fontWeight:300, color:'var(--g400)', margin:0, lineHeight:1.6 }}>
            Para cambios de plan o cancelaciones escribe a{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color:'var(--ink)' }}>{SUPPORT_EMAIL}</a>
          </p>
        </div>
      </div>
    </div>
  )
}

function HelpModal({ user, onClose }) {
  const [msg, setMsg]       = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]     = useState(false)
  const [err, setErr]       = useState('')

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

  const send = async () => {
    if (!msg.trim()) return
    setSending(true); setErr('')
    try {
      await loadEmailJS()
      await window.emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
        email_cliente: SUPPORT_EMAIL,
        name:          user.name || user.email,
        email:         user.email,
        proyecto:      'Soporte ArchPortal',
        cliente:       user.name || user.email,
        asunto:        `Ayuda solicitada — ${user.name || user.email}`,
        nota:          msg,
      })
      setSent(true)
    } catch(e) {
      console.error(e)
      setErr('No se pudo enviar. Intenta de nuevo.')
    } finally { setSending(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--white)', width:'100%', maxWidth:480, padding:0, boxShadow:'0 16px 48px rgba(0,0,0,.15)' }}>
        <div style={{ background:'var(--ink)', padding:'20px 28px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:10, letterSpacing:'.16em', textTransform:'uppercase', color:'rgba(255,255,255,.4)', margin:'0 0 2px' }}>ArchPortal</p>
            <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:400, color:'var(--white)', margin:0 }}>Centro de ayuda</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,.5)', fontSize:18, cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ padding:'28px' }}>
          {sent ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>✓</div>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, fontWeight:300, color:'var(--ink)', marginBottom:8 }}>Mensaje enviado</p>
              <p style={{ fontSize:13, fontWeight:300, color:'var(--g400)', lineHeight:1.7 }}>Nuestro equipo te responderá a <strong>{user.email}</strong> en breve.</p>
              <button onClick={onClose} style={{ marginTop:24, padding:'10px 28px', background:'var(--ink)', color:'var(--white)', border:'none', fontFamily:'Jost, sans-serif', fontSize:11, letterSpacing:'.08em', textTransform:'uppercase', cursor:'pointer' }}>Cerrar</button>
            </div>
          ) : (
            <>
              <p style={{ fontSize:13, fontWeight:300, color:'var(--g500)', lineHeight:1.7, marginBottom:24 }}>
                ¿Tienes alguna duda o problema? Escríbenos y te respondemos a la brevedad.
              </p>
              <div style={{ marginBottom:8 }}>
                <label style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--g400)', marginBottom:8, display:'block' }}>Tu mensaje</label>
                <textarea
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  placeholder="Describe tu duda o problema..."
                  rows={5}
                  style={{ width:'100%', padding:12, border:'1.5px solid var(--border)', fontFamily:'Jost, sans-serif', fontSize:13, fontWeight:300, color:'var(--ink)', outline:'none', resize:'vertical', lineHeight:1.7, boxSizing:'border-box', background:'transparent' }}
                />
              </div>
              <p style={{ fontSize:11, color:'var(--g400)', marginBottom:20 }}>
                Responderemos a <strong>{user.email}</strong>
              </p>
              {err && <p style={{ fontSize:12, color:'#B83232', marginBottom:12 }}>{err}</p>}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={onClose} style={{ padding:'11px 20px', background:'transparent', border:'1px solid var(--border)', fontFamily:'Jost, sans-serif', fontSize:11, color:'var(--g500)', cursor:'pointer', letterSpacing:'.08em', textTransform:'uppercase' }}>Cancelar</button>
                <button onClick={send} disabled={sending || !msg.trim()} style={{ flex:1, padding:'11px 20px', background: sending || !msg.trim() ? 'var(--g200)' : 'var(--ink)', color: sending || !msg.trim() ? 'var(--g400)' : 'var(--white)', border:'none', fontFamily:'Jost, sans-serif', fontSize:11, fontWeight:500, letterSpacing:'.08em', textTransform:'uppercase', cursor: sending || !msg.trim() ? 'not-allowed' : 'pointer' }}>
                  {sending ? 'Enviando…' : 'Enviar mensaje'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ proj, onSelect, onDelete }) {
  return (
    <div onClick={() => onSelect(proj)} style={{ background:'var(--white)', border:'1px solid var(--border)', padding:28, cursor:'pointer', transition:'all .2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:400, color:'var(--ink)', marginBottom:4 }}>{proj.nombre}</div>
          <div style={{ fontSize:12, fontWeight:300, color:'var(--g400)' }}>{proj.cliente || '—'}</div>
        </div>
        <span style={{ fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--g400)', border:'1px solid var(--border)', padding:'3px 8px', whiteSpace:'nowrap' }}>{proj.etapa_actual || 'Por iniciar'}</span>
      </div>
      <div style={{ height:1, background:'var(--border)', marginBottom:16 }} />
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:300, color:'var(--g400)', marginBottom:14 }}>
        <span>{proj.ubicacion?.split(',')[0] || '—'}</span>
        <span>Entrega: {proj.entrega || 'Por definir'}</span>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:14, borderTop:'1px solid var(--border)' }}>
        <button onClick={e => { e.stopPropagation(); onDelete(proj.id) }} style={{ padding:'5px 14px', background:'transparent', border:'1px solid var(--border)', color:'var(--g400)', fontSize:10, letterSpacing:'.08em', textTransform:'uppercase', cursor:'pointer', fontFamily:'Jost, sans-serif' }}>
          Eliminar
        </button>
      </div>
    </div>
  )
}

function ProjectsScreen({ user, projects, onSelect, onCreate, onDelete }) {
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState({ nombre:'', cliente:'', ubicacion:'' })
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [showHelp, setShowHelp]   = useState(false)
  const ini = (user.name||user.email||'U').split(' ').map(w=>w[0]||'').join('').substring(0,2).toUpperCase()

  const plan      = user.plan || 'mensual'
  const limit     = PLAN_LIMITS[plan] || 3
  const used      = projects.length
  const atLimit   = used >= limit

  const crear = async () => {
    if (!form.nombre.trim()) { setError('Escribe el nombre del proyecto'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/projects', { method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ user_id:user.id, ...form, arquitecto:user.name||user.email, presupuesto:0, pres_ejercido:0, pres_pagado:0, etapa_actual:'Por iniciar' }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      onCreate(data.project)
      setShowForm(false); setForm({nombre:'',cliente:'',ubicacion:''})
    } catch(e) { setError('Error al crear') } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--off)' }}>
      <div className="portal-topbar" style={{ height:'auto' }}>
      <div className="portal-topbar-row1">
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:400, color:'var(--ink)' }}>ArchPortal</div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => setShowHelp(true)} style={{ background:'none', border:'1px solid var(--border)', padding:'5px 14px', fontFamily:'Jost, sans-serif', fontSize:11, color:'var(--g400)', cursor:'pointer', letterSpacing:'.08em', textTransform:'uppercase' }}>Ayuda</button>
          <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={() => setShowProfile(true)}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--g200)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'var(--g600)' }}>{ini}</div>
            <span style={{ fontSize:13, fontWeight:300, color:'var(--g500)' }}>{user.name||user.email}</span>
            <span style={{ fontSize:10, color:'var(--g400)' }}>▾</span>
          </div>
          {user.impersonated && <span style={{ fontSize:10, padding:'3px 8px', background:'#FEF4E4', color:'#7A4A00', letterSpacing:'.06em', textTransform:'uppercase' }}>Impersonando</span>}
          <button onClick={() => window.location.reload()} style={{ background:'none', border:'1px solid var(--border)', padding:'6px 12px', fontFamily:'Jost, sans-serif', fontSize:11, color:'var(--g400)', cursor:'pointer', letterSpacing:'.08em', textTransform:'uppercase' }}>Salir</button>
        </div>
      </div>
      </div>

      <div style={{ padding:'48px 32px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:40 }}>
          <div>
            <p style={{ fontSize:10, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--g400)', marginBottom:8 }}>Tus proyectos</p>
            <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:48, fontWeight:300, color:'var(--ink)', lineHeight:1.1 }}>Selecciona un<br/><em style={{ fontStyle:'italic' }}>proyecto</em></h1>
            <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ height:4, width:120, background:'var(--g100)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:4, background: atLimit ? '#B83232' : 'var(--ink)', width: Math.min(100,(used/limit)*100)+'%', transition:'width .6s' }}/>
              </div>
              <span style={{ fontSize:11, color: atLimit ? '#B83232' : 'var(--g400)', fontWeight:300 }}>
                {used} de {limit} proyectos · Plan {plan}
              </span>
            </div>
          </div>
          <button onClick={() => { if(atLimit){ setError(`Tu plan ${plan} permite máximo ${limit} proyecto(s). Actualiza tu plan para agregar más.`); setShowForm(false); return; } setShowForm(!showForm) }} style={{ padding:'12px 24px', background: atLimit ? 'var(--g300)' : 'var(--ink)', color:'var(--white)', border:'none', fontFamily:'Jost, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', cursor: atLimit ? 'not-allowed' : 'pointer' }}>+ Nuevo proyecto</button>
        </div>
        {error && <p style={{ fontSize:12, color:'#B83232', marginBottom:16, padding:'12px 16px', background:'#FBE4E4' }}>{error}</p>}

        {showForm && (
          <div style={{ background:'var(--white)', border:'1px solid var(--border)', padding:32, marginBottom:32 }}>
            <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, fontWeight:400, color:'var(--ink)', marginBottom:24 }}>Nuevo proyecto</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0 24px' }}>
              {[['nombre','Nombre *','Casa López'],['cliente','Cliente','Familia López'],['ubicacion','Ubicación','Ensenada, BC']].map(([k,label,ph]) => (
                <div key={k} className="form-field">
                  <label className="form-label">{label}</label>
                  <input className="form-input" placeholder={ph} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
                </div>
              ))}
            </div>
            {error && !atLimit && <p style={{ fontSize:12, color:'#B83232', marginBottom:12 }}>{error}</p>}
            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button onClick={() => setShowForm(false)} style={{ padding:'10px 24px', background:'transparent', border:'1px solid var(--border)', fontFamily:'Jost, sans-serif', fontSize:11, color:'var(--g500)', cursor:'pointer', letterSpacing:'.08em', textTransform:'uppercase' }}>Cancelar</button>
              <button className="btn-submit" onClick={crear} disabled={loading} style={{ maxWidth:180, marginTop:0 }}>{loading?'...':'Crear proyecto'}</button>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div style={{ padding:'80px 0', textAlign:'center', color:'var(--g400)', fontSize:14, fontWeight:300 }}>No tienes proyectos aún. Crea tu primer proyecto arriba.</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
            {projects.map((proj,i) => <ProjectCard key={proj.id||i} proj={proj} onSelect={onSelect} onDelete={onDelete} />)}
          </div>
        )}
      </div>

      {showProfile && <ProfilePanel user={user} onClose={() => setShowProfile(false)} />}
      {showHelp    && <HelpModal    user={user} onClose={() => setShowHelp(false)} />}
    </div>
  )
}

export default function Portal({ user, projects:initialProjects, onLogout, lang, clientProjectData }) {
  const [activeTab, setActiveTab]     = useState('dashboard')
  const [projects, setProjects]       = useState(initialProjects || [])
  const [activeProject, setActiveProject] = useState(clientProjectData?.project || null)
  const [projectData, setProjectData] = useState(clientProjectData || null)
  const [showProfile, setShowProfile] = useState(false)
  const [showHelp, setShowHelp]       = useState(false)

  const isArq = user.role === 'arq' || user.impersonated
  const tabs  = isArq ? TABS_ARQ : TABS_CLI
  const ini   = (user.name||user.email||'U').split(' ').map(w=>w[0]||'').join('').substring(0,2).toUpperCase()

  const handleSelect = useCallback(async (proj) => {
    const res = await fetch(`/api/projects?id=${proj.id}`)
    const data = await res.json()
    setActiveProject(proj)
    setProjectData(data)
    setActiveTab('dashboard')
  }, [])

  const refreshProject = useCallback(async () => {
    if (!activeProject?.id) return
    const res = await fetch(`/api/projects?id=${activeProject.id}`)
    const data = await res.json()
    setProjectData({ ...data })
  }, [activeProject?.id])

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este proyecto?')) return
    await fetch(`/api/projects?id=${id}`, { method:'DELETE' })
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  if (!activeProject) {
    return <ProjectsScreen user={user} projects={projects} onSelect={handleSelect} onCreate={p => setProjects(prev=>[...prev,p])} onDelete={handleDelete} />
  }

  const props = { project:projectData, user, lang, onRefresh:refreshProject }

  const renderTab = () => {
    switch(activeTab) {
      case 'dashboard':  return <Dashboard {...props} />
      case 'costos':     return <Costos {...props} isArq={isArq} />
      case 'archivos':   return <Archivos {...props} isArq={isArq} />
      case 'cronograma': return <Cronograma {...props} />
      case 'soporte':    return <Soporte {...props} isArq={isArq} />
      case 'admin':      return isArq ? <Admin {...props} /> : <Dashboard {...props} />
      default:           return <Dashboard {...props} />
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--off)' }}>
      <div className="portal-topbar">
        {/* Fila 1: logo + usuario (visible en móvil y desktop) */}
        <div className="portal-topbar-row1">
          <div className="portal-logo" onClick={() => { setActiveProject(null); setProjectData(null) }}>ArchPortal</div>
          <div className="portal-user">
            {isArq && <button onClick={() => setShowHelp(true)} style={{ background:'none', border:'1px solid rgba(0,0,0,.12)', padding:'5px 14px', fontFamily:'Jost, sans-serif', fontSize:11, color:'var(--g400)', cursor:'pointer', letterSpacing:'.08em', textTransform:'uppercase' }}>Ayuda</button>}
            <div style={{ display:'flex', alignItems:'center', gap:6, cursor: isArq ? 'pointer' : 'default' }} onClick={() => isArq && setShowProfile(true)}>
              <div className="portal-avatar">{ini}</div>
              <span className="portal-username" style={{ fontSize:12, color:'var(--g400)' }}>{activeProject?.nombre || '—'}</span>
              {isArq && <span style={{ fontSize:10, color:'var(--g400)' }}>▾</span>}
            </div>
            {user.impersonated && <span style={{ fontSize:10, padding:'3px 8px', background:'#FEF4E4', color:'#7A4A00' }}>Admin</span>}
            <button className="btn-logout" onClick={onLogout}>{lang==='en' ? 'Sign out' : 'Salir'}</button>
          </div>
        </div>
        {/* Fila 2: tabs (scroll horizontal en móvil) */}
        <div className="portal-tabs">
          {tabs.map(tab => (
            <button key={tab.id} className={`portal-tab ${activeTab===tab.id?'active':''}`} onClick={() => setActiveTab(tab.id)}>
              {lang==='en' ? tab.en : tab.es}
            </button>
          ))}
        </div>
      </div>
      <div className="page-content">{renderTab()}</div>

      {showProfile && <ProfilePanel user={user} onClose={() => setShowProfile(false)} />}
      {showHelp    && <HelpModal    user={user} onClose={() => setShowHelp(false)} />}
    </div>
  )
}
