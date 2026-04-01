'use client'
import { useState, useCallback } from 'react'
import Dashboard from './Dashboard'
import Costos from './Costos'
import Archivos from './Archivos'
import Soporte from './Soporte'
import Cronograma from './Cronograma'
import Admin from './Admin'

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
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre:'', cliente:'', ubicacion:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const ini = (user.name||user.email||'U').split(' ').map(w=>w[0]||'').join('').substring(0,2).toUpperCase()

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
      <div style={{ background:'var(--white)', borderBottom:'1px solid var(--border)', padding:'0 32px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:400, color:'var(--ink)' }}>ArchPortal</div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--g200)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'var(--g600)' }}>{ini}</div>
          <span style={{ fontSize:13, fontWeight:300, color:'var(--g500)' }}>{user.name||user.email}</span>
          {user.impersonated && <span style={{ fontSize:10, padding:'3px 8px', background:'#FEF4E4', color:'#7A4A00', letterSpacing:'.06em', textTransform:'uppercase' }}>Impersonando</span>}
          <button onClick={() => window.location.reload()} style={{ background:'none', border:'1px solid var(--border)', padding:'6px 12px', fontFamily:'Jost, sans-serif', fontSize:11, color:'var(--g400)', cursor:'pointer', letterSpacing:'.08em', textTransform:'uppercase' }}>Salir</button>
        </div>
      </div>

      <div style={{ padding:'48px 32px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:40 }}>
          <div>
            <p style={{ fontSize:10, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--g400)', marginBottom:8 }}>Tus proyectos</p>
            <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:48, fontWeight:300, color:'var(--ink)', lineHeight:1.1 }}>Selecciona un<br/><em style={{ fontStyle:'italic' }}>proyecto</em></h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ padding:'12px 24px', background:'var(--ink)', color:'var(--white)', border:'none', fontFamily:'Jost, sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', cursor:'pointer' }}>+ Nuevo proyecto</button>
        </div>

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
            {error && <p style={{ fontSize:12, color:'#B83232', marginBottom:12 }}>{error}</p>}
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
    </div>
  )
}

export default function Portal({ user, projects:initialProjects, onLogout, lang }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [projects, setProjects] = useState(initialProjects || [])
  const [activeProject, setActiveProject] = useState(null)
  const [projectData, setProjectData] = useState(null)

  const isArq = user.role === 'arq' || user.impersonated
  const tabs = isArq ? TABS_ARQ : TABS_CLI
  const ini = (user.name||user.email||'U').split(' ').map(w=>w[0]||'').join('').substring(0,2).toUpperCase()

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
      case 'costos':     return <Costos {...props} />
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
        <div className="portal-logo" onClick={() => { setActiveProject(null); setProjectData(null) }}>ArchPortal</div>
        <div className="portal-tabs">
          {tabs.map(tab => (
            <button key={tab.id} className={`portal-tab ${activeTab===tab.id?'active':''}`} onClick={() => setActiveTab(tab.id)}>
              {lang==='en' ? tab.en : tab.es}
            </button>
          ))}
        </div>
        <div className="portal-user">
          <div className="portal-avatar">{ini}</div>
          {user.impersonated && <span style={{ fontSize:10, padding:'3px 8px', background:'#FEF4E4', color:'#7A4A00' }}>Admin</span>}
          <span style={{ fontSize:12, color:'var(--g400)' }}>{activeProject?.nombre || '—'}</span>
          <button className="btn-logout" onClick={onLogout}>{lang==='en' ? 'Sign out' : 'Salir'}</button>
        </div>
      </div>
      <div className="page-content">{renderTab()}</div>
    </div>
  )
}
