'use client'
import { useState, useEffect } from 'react'

const PLANS = {
  mensual:{label:'Plan Básico',price:'$840 MXN / mes',limit:'1 proyecto activo'},
  trimestral:{label:'Plan Pro',price:'$1,800 MXN / mes',limit:'Hasta 5 proyectos'},
  anual:{label:'Plan Despacho',price:'$3,000 MXN / mes',limit:'Hasta 20 proyectos'},
  monthly:{label:'Basic Plan',price:'$840 MXN / month',limit:'1 active project'},
  quarterly:{label:'Pro Plan',price:'$1,800 MXN / month',limit:'Up to 5 projects'},
  annual:{label:'Firm Plan',price:'$3,000 MXN / month',limit:'Up to 20 projects'},
}

import { sendWelcomeEmail, sendMembershipEmail } from "@/lib/emailjs"

export default function RegisterModal({ onClose, plan, onSuccess, lang, onShowTerms, onShowPrivacy }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tcAccepted, setTcAccepted] = useState(false)
  const [coupon, setCoupon] = useState('')
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
      const res = await fetch('/api/stripe/checkout', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ ...form, plan, coupon: coupon.trim().toUpperCase() || undefined })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al procesar el pago'); return }
      if (data.url) window.location.href = data.url
    } catch(e) { setError('Error al conectar con el procesador de pagos. Intenta de nuevo.') }
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
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{planInfo.label}</div>
                    <div style={{fontSize:12,fontWeight:300,color:'var(--g400)',marginTop:2}}>{planInfo.limit}</div>
                  </div>
                  <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:400,color:'var(--ink)'}}>{planInfo.price}</div>
                </div>
              </div>

              {/* T&C */}
              <div style={{marginBottom:24}}>
                <label className="form-label">{lang==='en'?'Terms and conditions':'Términos y condiciones'}</label>
                <div style={{height:180,overflowY:'scroll',border:'1px solid var(--border)',padding:16,fontSize:11,fontWeight:300,color:'var(--g500)',lineHeight:1.8,marginBottom:12}}>
                  <p style={{fontWeight:500,color:'var(--ink)',marginBottom:10,fontSize:12}}>Términos y Condiciones — ArchPortal · Versión 1.0</p>
                  <p style={{marginBottom:8}}><strong>1. Descripción:</strong> ArchPortal es una plataforma SaaS para gestión de proyectos de arquitectura y construcción.</p>
                  <p style={{marginBottom:8}}><strong>2. Cuentas:</strong> Eres responsable de mantener la confidencialidad de tus credenciales y de todas las actividades bajo tu cuenta.</p>
                  <p style={{marginBottom:8}}><strong>3. Propiedad:</strong> Conservas todos los derechos sobre tus planos, documentos y fotografías. Al subirlos otorgas una licencia no exclusiva solo para prestar el servicio.</p>
                  <p style={{marginBottom:8}}><strong>4. Uso aceptable:</strong> No uses la plataforma para contenido ilegal, difamatorio o que infrinja derechos de terceros.</p>
                  <p style={{marginBottom:8}}><strong>5. Pagos:</strong> Los cobros son recurrentes según el ciclo elegido. Reembolso completo disponible en los primeros 7 días naturales sin uso.</p>
                  <p style={{marginBottom:8}}><strong>6. Limitación de responsabilidad:</strong> ArchPortal no es responsable por errores de construcción ni por las respuestas del asistente de IA. La responsabilidad máxima no excederá 3 meses de suscripción.</p>
                  <p style={{marginBottom:8}}><strong>7. Privacidad:</strong> El tratamiento de datos personales se rige por la LFPDPPP conforme a nuestro Aviso de Privacidad.</p>
                  <p><strong>8. Legislación:</strong> Estos Términos se rigen por las leyes de México, jurisdicción Ensenada, Baja California.</p>
                </div>
                <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',marginBottom:10}}>
                  <input type="checkbox" checked={tcAccepted} onChange={e=>setTcAccepted(e.target.checked)} style={{marginTop:3,width:15,height:15,flexShrink:0,cursor:'pointer',accentColor:'var(--ink)'}}/>
                  <span style={{fontSize:12,fontWeight:300,color:'var(--ink)',lineHeight:1.6}}>
                    {lang==='en'?'I have read and accept the ':'He leído y acepto los '}
                    <strong onClick={onShowTerms} style={{cursor:'pointer',textDecoration:'underline'}}>{lang==='en'?'Terms and Conditions':'Términos y Condiciones'}</strong>
                    {lang==='en'?' and ':' y el '}
                    <strong onClick={onShowPrivacy} style={{cursor:'pointer',textDecoration:'underline'}}>{lang==='en'?'Privacy Notice':'Aviso de Privacidad'}</strong>
                    {lang==='en'?' of ArchPortal.':', de ArchPortal.'}
                  </span>
                </label>
              </div>

              {/* Coupon */}
              <div className="form-field" style={{marginBottom:16}}>
                <label className="form-label">{lang==='en'?'Coupon code (optional)':'Código de descuento (opcional)'}</label>
                <input className="form-input" placeholder={lang==='en'?'Coupon code':'Código de cupón'} value={coupon} onChange={e=>setCoupon(e.target.value)} style={{textTransform:'uppercase'}}/>
              </div>

              {/* Card fields */}
              <div style={{background:'var(--paper)',border:'1px solid var(--border)',padding:'20px 24px',marginBottom:24,textAlign:'center'}}>
                <div style={{fontSize:32,marginBottom:12}}>🔒</div>
                <p style={{fontSize:13,fontWeight:400,color:'var(--ink)',marginBottom:6}}>{lang==='en'?'Secure payment via Stripe':'Pago seguro a través de Stripe'}</p>
                <p style={{fontSize:12,fontWeight:300,color:'var(--g400)',margin:0}}>{lang==='en'?'You will be redirected to Stripe to complete your payment safely.':'Serás redirigido a Stripe para completar tu pago de forma segura.'}</p>
              </div>
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
