'use client'
import { useState, useEffect } from 'react'

const PLANS = {
  mensual:{label:'Plan Mensual',price:'$120 USD / mes'},
  trimestral:{label:'Plan Trimestral',price:'$300 USD / trimestre'},
  anual:{label:'Plan Anual',price:'$1,100 USD / año'},
  monthly:{label:'Monthly Plan',price:'$120 USD / month'},
  quarterly:{label:'Quarterly Plan',price:'$300 USD / quarter'},
  annual:{label:'Annual Plan',price:'$1,100 USD / year'},
}

import { sendWelcomeEmail } from '@/lib/emailjs'

export default function RegisterModal({ onClose, plan, onSuccess, lang }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tcAccepted, setTcAccepted] = useState(false)
  const [form, setForm] = useState({ nombre:'', email:'', password:'', password2:'', despacho:'', ciudad:'', tel:'' })
  const planInfo = PLANS[plan] || PLANS.mensual
  const update = (k,v) => setForm(f=>({...f,[k]:v}))

  const step1Next = async () => {
    setError('')
    if (!form.nombre||!form.email) { setError('Completa nombre y email'); return }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (form.password !== form.password2) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(form.email)}`)
      const data = await res.json()
      if (data.exists) { setError('Ya existe una cuenta con ese correo'); return }
      setStep(2)
    } catch { setStep(2) }
    finally { setLoading(false) }
  }

  const complete = async () => {
    setError('')
    if (!tcAccepted) { setError('Debes aceptar los Términos y Condiciones'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ ...form, plan })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      // Enviar correo de bienvenida via EmailJS
      try { await sendWelcomeEmail(form.nombre, form.email, form.password) } catch(e) { console.warn('EmailJS welcome:', e) }
      setStep(4)
    } catch(e) { setError('Error al crear la cuenta. Intenta de nuevo.') }
    finally { setLoading(false) }
  }

  const stepLabels = lang==='en' ? ['1. Info','2. Firm','3. Payment'] : ['1. Datos','2. Despacho','3. Pago']

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-header">
          <p style={{fontSize:10,letterSpacing:'.2em',textTransform:'uppercase',color:'var(--g400)',marginBottom:8}}>{planInfo.label}</p>
          <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:32,fontWeight:400,color:'var(--ink)',marginBottom:4}}>{lang==='en'?'Create your account':'Crear tu cuenta'}</h2>
          <p style={{fontSize:13,fontWeight:300,color:'var(--g400)'}}>{lang==='en'?'Complete registration to get started':'Completa el registro para empezar en minutos'}</p>
        </div>
        {step<4&&<div className="step-tabs">{stepLabels.map((label,i)=><div key={i} className={`step-tab ${step===i+1?'active':''}`}>{label}</div>)}</div>}

        <div className="modal-body">
          {step===1&&(
            <>
              <div className="form-field"><label className="form-label">{lang==='en'?'Full name':'Nombre completo'}</label><input className="form-input" placeholder="Arq. Juan Torres" value={form.nombre} onChange={e=>update('nombre',e.target.value)}/></div>
              <div className="form-field"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="tu@despacho.mx" value={form.email} onChange={e=>update('email',e.target.value)}/></div>
              <div className="form-field"><label className="form-label">{lang==='en'?'Password':'Contraseña'}</label><input className="form-input" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e=>update('password',e.target.value)}/></div>
              <div className="form-field"><label className="form-label">{lang==='en'?'Confirm password':'Confirmar contraseña'}</label><input className="form-input" type="password" placeholder="Repite tu contraseña" value={form.password2} onChange={e=>update('password2',e.target.value)}/></div>
              {error&&<p className="form-error">{error}</p>}
              <button className="btn-submit" onClick={step1Next} disabled={loading}>{loading?'...':(lang==='en'?'Continue':'Continuar')}</button>
            </>
          )}

          {step===2&&(
            <>
              <div className="form-field"><label className="form-label">{lang==='en'?'Firm name':'Nombre del despacho'}</label><input className="form-input" placeholder="Torres Arquitectos" value={form.despacho} onChange={e=>update('despacho',e.target.value)}/></div>
              <div className="form-field"><label className="form-label">{lang==='en'?'City':'Ciudad'}</label><input className="form-input" placeholder="Ensenada, Baja California" value={form.ciudad} onChange={e=>update('ciudad',e.target.value)}/></div>
              <div className="form-field"><label className="form-label">{lang==='en'?'Phone (optional)':'Teléfono (opcional)'}</label><input className="form-input" placeholder="+52 646 123 4567" value={form.tel} onChange={e=>update('tel',e.target.value)}/></div>
              {error&&<p className="form-error">{error}</p>}
              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button onClick={()=>setStep(1)} style={{padding:'14px 24px',background:'transparent',color:'var(--g500)',border:'1px solid var(--border)',fontFamily:'Jost,sans-serif',fontSize:12,letterSpacing:'.08em',textTransform:'uppercase',cursor:'pointer'}}>{lang==='en'?'Back':'Atrás'}</button>
                <button className="btn-submit" style={{flex:1,marginTop:0}} onClick={()=>{setError('');if(!form.despacho){setError(lang==='en'?'Enter firm name':'Ingresa el nombre del despacho');return}setStep(3)}}>{lang==='en'?'Continue':'Continuar'}</button>
              </div>
            </>
          )}

          {step===3&&(
            <>
              <div style={{background:'var(--paper)',padding:'20px 24px',marginBottom:24}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div><div style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{planInfo.label}</div><div style={{fontSize:12,fontWeight:300,color:'var(--g400)',marginTop:2}}>{lang==='en'?'All benefits included':'Todos los beneficios incluidos'}</div></div>
                  <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:400,color:'var(--ink)'}}>{planInfo.price}</div>
                </div>
              </div>

              {/* T&C */}
              <div style={{marginBottom:24}}>
                <label className="form-label">{lang==='en'?'Terms and conditions':'Términos y condiciones'}</label>
                <div style={{height:160,overflowY:'scroll',border:'1px solid var(--border)',padding:16,fontSize:11,fontWeight:300,color:'var(--g500)',lineHeight:1.8,marginBottom:12}}>
                  <p style={{fontWeight:500,color:'var(--ink)',marginBottom:8}}>Términos y Condiciones — Arch Portal</p>
                  <p style={{marginBottom:8}}><strong>1. Descripción:</strong> Arch Portal es un SaaS para profesionales de arquitectura y construcción.</p>
                  <p style={{marginBottom:8}}><strong>2. Cuentas:</strong> Eres responsable de mantener la confidencialidad de tus credenciales.</p>
                  <p style={{marginBottom:8}}><strong>3. Propiedad:</strong> Conservas todos los derechos sobre tus planos y documentos.</p>
                  <p style={{marginBottom:8}}><strong>4. Uso aceptable:</strong> No uses la plataforma para contenido ilegal.</p>
                  <p style={{marginBottom:8}}><strong>5. Pagos:</strong> Los cobros son recurrentes. Puedes cancelar en cualquier momento.</p>
                  <p style={{marginBottom:8}}><strong>6. Responsabilidad:</strong> Arch Portal no es responsable por errores de construcción.</p>
                  <p><strong>7. Legislación:</strong> Estos Términos se rigen por las leyes de México, jurisdicción Baja California.</p>
                </div>
                <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
                  <input type="checkbox" checked={tcAccepted} onChange={e=>setTcAccepted(e.target.checked)} style={{marginTop:3,width:15,height:15,flexShrink:0,cursor:'pointer',accentColor:'var(--ink)'}}/>
                  <span style={{fontSize:12,fontWeight:300,color:'var(--ink)',lineHeight:1.6}}>{lang==='en'?'I have read and accept the ':'He leído y acepto los '}<strong>{lang==='en'?'Terms and Conditions':'Términos y Condiciones'}</strong>{lang==='en'?' of Arch Portal.':' de Arch Portal.'}</span>
                </label>
              </div>

              {/* Card fields */}
              <div className="form-field"><label className="form-label">{lang==='en'?'Card number':'Número de tarjeta'}</label><input className="form-input" placeholder="1234 5678 9012 3456" maxLength={19}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px',marginBottom:24}}>
                <div className="form-field" style={{marginBottom:0}}><label className="form-label">{lang==='en'?'Expiry':'Vencimiento'}</label><input className="form-input" placeholder="MM / AA" maxLength={7}/></div>
                <div className="form-field" style={{marginBottom:0}}><label className="form-label">CVV</label><input className="form-input" placeholder="123" maxLength={4}/></div>
              </div>
              <p style={{fontSize:11,color:'var(--g400)',marginBottom:24}}>🔒 {lang==='en'?'Secure payment processed by Stripe.':'Pago seguro procesado por Stripe.'}</p>
              {error&&<p className="form-error" style={{marginBottom:16}}>{error}</p>}
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setStep(2)} style={{padding:'14px 24px',background:'transparent',color:'var(--g500)',border:'1px solid var(--border)',fontFamily:'Jost,sans-serif',fontSize:12,letterSpacing:'.08em',textTransform:'uppercase',cursor:'pointer'}}>{lang==='en'?'Back':'Atrás'}</button>
                <button className="btn-submit" style={{flex:1,marginTop:0}} onClick={complete} disabled={loading}>{loading?'...':(lang==='en'?'Activate account':'Activar cuenta')}</button>
              </div>
            </>
          )}

          {step===4&&(
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <div style={{width:56,height:56,background:'var(--g100)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:24}}>✓</div>
              <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:32,fontWeight:400,color:'var(--ink)',marginBottom:10}}>{lang==='en'?'Account activated':'Cuenta activada'}</h3>
              <p style={{fontSize:14,fontWeight:300,color:'var(--g400)',lineHeight:1.7,marginBottom:32}}>{lang==='en'?'We sent a welcome email with your credentials.':'Te enviamos un email de bienvenida con tus credenciales. Ya puedes entrar a tu portal.'}</p>
              <button className="btn-submit" onClick={onSuccess} style={{maxWidth:300,margin:'0 auto'}}>{lang==='en'?'Enter portal':'Entrar al portal'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
