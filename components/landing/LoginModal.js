'use client'
import { useState } from 'react'

export default function LoginModal({ onClose, onLogin, onRegister, lang }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  const t = lang==='en'
    ? {title:'Sign in',sub:'Sign in to your project portal',user:'Email',pass:'Password',btn:'Enter portal',err:'Incorrect username or password',back:'Back to home',noAccount:"Don't have an account?",register:'Register',forgot:'Forgot password?',forgotTitle:'Password recovery',forgotSub:'Enter your email and we will send your access information.',forgotBtn:'Send',forgotSentMsg:'If you have an architect account, you will receive an email shortly.',cancel:'Cancel'}
    : {title:'ArchPortal',sub:'Ingresa a tu portal de proyecto',user:'Usuario',pass:'Contraseña',btn:'Entrar al portal',err:'Usuario o contraseña incorrectos',back:'Volver al inicio',noAccount:'¿No tienes cuenta?',register:'Regístrate',forgot:'¿Olvidaste tu contraseña?',forgotTitle:'Recuperar acceso',forgotSub:'Ingresa tu correo de arquitecto y te enviaremos tu información de acceso.',forgotBtn:'Enviar',forgotSentMsg:'Si tienes una cuenta de arquitecto recibirás un correo en breve.',cancel:'Cancelar'}

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) })
      const data = await res.json()
      if (!res.ok) { setError(data.error||t.err); return }
      
      if (data.user.role === 'master') {
        onLogin(data.user, [], null); return
      }
      if (data.user.role === 'cli') {
        onLogin(data.user, [], data.client_project); return
      }
      // Architect - load projects
      const projRes = await fetch(`/api/projects?user_id=${data.user.id}`)
      const projData = await projRes.json()
      onLogin(data.user, projData.projects||[], null)
    } catch { setError(t.err) }
    finally { setLoading(false) }
  }

  const handleForgot = async () => {
    if (!forgotEmail) return
    setForgotLoading(true)
    try {
      await fetch('/api/auth/forgot-password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:forgotEmail}) })
      setForgotSent(true)
    } catch { setForgotSent(true) }
    finally { setForgotLoading(false) }
  }

  if (showForgot) return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:420}}>
        <div className="modal-body">
          <button className="modal-close" onClick={onClose}>✕</button>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:400,color:'var(--ink)',marginBottom:4}}>ArchPortal</div>
          <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:400,color:'var(--ink)',marginBottom:8}}>{t.forgotTitle}</h3>
          <p style={{fontSize:13,fontWeight:300,color:'var(--g400)',marginBottom:24,lineHeight:1.7}}>{t.forgotSub}</p>
          {!forgotSent ? (
            <>
              <div className="form-field"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="tu@despacho.mx" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)}/></div>
              <button className="btn-submit" onClick={handleForgot} disabled={forgotLoading||!forgotEmail} style={{marginTop:16}}>{forgotLoading?'...':t.forgotBtn}</button>
            </>
          ) : (
            <div style={{background:'var(--paper)',padding:20,borderLeft:'3px solid var(--ink)',marginBottom:20}}>
              <p style={{fontSize:13,fontWeight:300,color:'var(--ink)',lineHeight:1.7,margin:0}}>{t.forgotSentMsg}</p>
            </div>
          )}
          <button onClick={()=>setShowForgot(false)} style={{display:'block',margin:'16px auto 0',background:'none',border:'none',fontSize:12,color:'var(--g400)',cursor:'pointer',fontFamily:'Jost,sans-serif'}}>← {t.cancel}</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:420}}>
        <div className="modal-body">
          <button className="modal-close" onClick={onClose}>✕</button>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:400,color:'var(--ink)',marginBottom:4,cursor:'pointer'}} onClick={onClose}>ArchPortal</div>
          <p style={{fontSize:13,fontWeight:300,color:'var(--g400)',marginBottom:32}}>{t.sub}</p>
          <form onSubmit={handleLogin}>
            <div className="form-field"><label className="form-label">{t.user}</label><input type="email" className="form-input" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
            <div className="form-field"><label className="form-label">{t.pass}</label><input type="password" className="form-input" placeholder="..." value={password} onChange={e=>setPassword(e.target.value)} required/></div>
            {error&&<p className="form-error">{error}</p>}
            <button type="submit" className="btn-submit" disabled={loading} style={{marginTop:24}}>{loading?'Cargando...':t.btn}</button>
          </form>
          <button onClick={()=>setShowForgot(true)} style={{display:'block',margin:'16px auto 0',background:'none',border:'none',fontSize:12,color:'var(--g400)',cursor:'pointer',fontFamily:'Jost,sans-serif',textDecoration:'underline'}}>{t.forgot}</button>
          <p style={{marginTop:16,fontSize:12,fontWeight:300,color:'var(--g400)',textAlign:'center'}}>{t.noAccount}{' '}<span style={{color:'var(--ink)',cursor:'pointer',textDecoration:'underline'}} onClick={onRegister}>{t.register}</span></p>
          <button onClick={onClose} style={{display:'block',margin:'12px auto 0',background:'none',border:'none',fontSize:12,color:'var(--g400)',cursor:'pointer',fontFamily:'Jost,sans-serif'}}>{t.back}</button>
        </div>
      </div>
    </div>
  )
}
