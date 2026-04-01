'use client'
import { useState, useEffect } from 'react'

export default function MasterPanel({ onImpersonate, onLogout }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [apiSaved, setApiSaved] = useState(false)

  useEffect(() => {
    fetch('/api/master').then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false) })
    // Load saved API key from localStorage
    const saved = localStorage.getItem('master_anthropic_key') || ''
    setApiKey(saved)
  }, [])

  const saveApiKey = () => {
    localStorage.setItem('master_anthropic_key', apiKey.trim())
    setApiSaved(true)
    setTimeout(() => setApiSaved(false), 2500)
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString('es-MX') : '—'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)' }}>
      <div style={{ background: 'var(--ink)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 400, color: 'var(--white)' }}>ArchPortal <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginLeft: 12 }}>Panel Maestro</span></div>
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
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '1.5px solid var(--border)', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 300, background: 'transparent', color: 'var(--ink)', outline: 'none' }}
              />
            </div>
            <button onClick={saveApiKey} style={{ padding: '12px 28px', background: 'var(--ink)', color: 'var(--white)', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {apiSaved ? '✓ Guardado' : 'Guardar key'}
            </button>
          </div>
          {apiKey && <p style={{ fontSize: 11, color: 'var(--g400)', marginTop: 10 }}>Key activa: {apiKey.substring(0, 16)}...</p>}
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
