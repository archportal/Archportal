'use client'
import { useState } from 'react'
import { getPlanInfo } from '@/lib/plans'

export default function RegisterModal({ onClose, plan, onSuccess, lang, onShowTerms, onShowPrivacy }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tcAccepted, setTcAccepted] = useState(false)
  const [coupon, setCoupon] = useState('')
  const [form, setForm] = useState({ nombre: '', email: '', password: '', password2: '', despacho: '', ciudad: '', tel: '' })
  const planInfo = getPlanInfo(plan, lang)
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Strings i18n
  const i18n = {
    es: {
      header_title: 'Crear tu cuenta',
      header_sub: 'Completa el registro para empezar en minutos',
      steps: ['1. Datos', '2. Despacho', '3. Pago'],
      f_name: 'Nombre completo',
      f_email: 'Email',
      f_pass: 'Contraseña',
      f_pass_ph: 'Mínimo 10 caracteres',
      f_pass2: 'Confirmar contraseña',
      f_pass2_ph: 'Repite tu contraseña',
      f_firm: 'Nombre del despacho',
      f_firm_ph: 'Torres Arquitectos',
      f_city: 'Ciudad',
      f_city_ph: 'Ensenada, Baja California',
      f_tel: 'Teléfono (opcional)',
      f_tel_ph: '+52 646 123 4567',
      err_required: 'Completa nombre y email',
      err_pass_short: 'La contraseña debe tener al menos 10 caracteres',
      err_pass_match: 'Las contraseñas no coinciden',
      err_email_exists: 'Ya existe una cuenta con ese correo',
      err_email_check: 'No pudimos verificar tu email. Intenta de nuevo.',
      err_firm_required: 'Ingresa el nombre del despacho',
      err_tc_required: 'Debes aceptar los Términos y Condiciones',
      err_payment: 'Error al procesar el pago',
      err_payment_connect: 'Error al conectar con el procesador de pagos. Intenta de nuevo.',
      btn_continue: 'Continuar',
      btn_back: 'Atrás',
      btn_activate: 'Activar cuenta',
      loading: '...',
      tc_label: 'Términos y condiciones',
      tc_short_intro: 'Términos y Condiciones — ArchPortal · Versión 1.0',
      tc_accept_pre: 'He leído y acepto los ',
      tc_accept_terms: 'Términos y Condiciones',
      tc_accept_and: ' y el ',
      tc_accept_priv: 'Aviso de Privacidad',
      tc_accept_post: ', de ArchPortal.',
      coupon_label: 'Código de descuento (opcional)',
      coupon_ph: 'Código de cupón',
      pay_secure: 'Pago seguro a través de Stripe',
      pay_redirect: 'Serás redirigido a Stripe para completar tu pago de forma segura.',
      activated_title: 'Cuenta activada',
      activated_desc: 'Te enviamos un email de bienvenida. Ya puedes entrar a tu portal con tu email y contraseña.',
      activated_btn: 'Entrar al portal',
    },
    en: {
      header_title: 'Create your account',
      header_sub: 'Complete registration to get started',
      steps: ['1. Info', '2. Firm', '3. Payment'],
      f_name: 'Full name',
      f_email: 'Email',
      f_pass: 'Password',
      f_pass_ph: 'Minimum 10 characters',
      f_pass2: 'Confirm password',
      f_pass2_ph: 'Repeat your password',
      f_firm: 'Firm name',
      f_firm_ph: 'Torres Architects',
      f_city: 'City',
      f_city_ph: 'Ensenada, Baja California',
      f_tel: 'Phone (optional)',
      f_tel_ph: '+52 646 123 4567',
      err_required: 'Enter name and email',
      err_pass_short: 'Password must be at least 10 characters',
      err_pass_match: 'Passwords do not match',
      err_email_exists: 'An account with that email already exists',
      err_email_check: 'Could not verify your email. Please try again.',
      err_firm_required: 'Enter firm name',
      err_tc_required: 'You must accept the Terms and Conditions',
      err_payment: 'Payment processing error',
      err_payment_connect: 'Could not connect to the payment processor. Try again.',
      btn_continue: 'Continue',
      btn_back: 'Back',
      btn_activate: 'Activate account',
      loading: '...',
      tc_label: 'Terms and conditions',
      tc_short_intro: 'Terms and Conditions — ArchPortal · Version 1.0',
      tc_accept_pre: 'I have read and accept the ',
      tc_accept_terms: 'Terms and Conditions',
      tc_accept_and: ' and ',
      tc_accept_priv: 'Privacy Notice',
      tc_accept_post: ' of ArchPortal.',
      coupon_label: 'Coupon code (optional)',
      coupon_ph: 'Coupon code',
      pay_secure: 'Secure payment via Stripe',
      pay_redirect: 'You will be redirected to Stripe to complete your payment safely.',
      activated_title: 'Account activated',
      activated_desc: 'We sent you a welcome email. You can now enter the portal with your email and password.',
      activated_btn: 'Enter portal',
    },
  }[lang === 'en' ? 'en' : 'es']

  // Confirma cierre si hay datos llenos
  const handleBackdropClose = () => {
    if (form.email || form.nombre) {
      const msg = lang === 'en'
        ? 'Close registration? You will lose the data you entered.'
        : '¿Cerrar el registro? Perderás los datos ingresados.'
      if (window.confirm(msg)) onClose()
    } else {
      onClose()
    }
  }

  const step1Next = async () => {
    setError('')
    if (!form.nombre || !form.email) { setError(i18n.err_required); return }
    if (form.password.length < 10) { setError(i18n.err_pass_short); return }
    if (form.password !== form.password2) { setError(i18n.err_pass_match); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(form.email)}`)
      if (!res.ok) {
        setError(i18n.err_email_check)
        return
      }
      const data = await res.json()
      if (data.exists) { setError(i18n.err_email_exists); return }
      setStep(2)
    } catch {
      setError(i18n.err_email_check)
    } finally {
      setLoading(false)
    }
  }

  const complete = async () => {
    setError('')
    if (!tcAccepted) { setError(i18n.err_tc_required); return }
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan, coupon: coupon.trim().toUpperCase() || undefined })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || i18n.err_payment); return }
      if (data.url) window.location.href = data.url
    } catch {
      setError(i18n.err_payment_connect)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && handleBackdropClose()}>
      <div className="modal">
        <button className="modal-close" onClick={handleBackdropClose}>✕</button>
        <div className="modal-header">
          <p style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--g400)', marginBottom: 8 }}>{planInfo.label}</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 32, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>{i18n.header_title}</h2>
          <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--g400)' }}>{i18n.header_sub}</p>
        </div>
        {step < 4 && (
          <div className="step-tabs">
            {i18n.steps.map((label, i) => <div key={i} className={`step-tab ${step === i + 1 ? 'active' : ''}`}>{label}</div>)}
          </div>
        )}

        <div className="modal-body">
          {step === 1 && (
            <>
              <div className="form-field"><label className="form-label">{i18n.f_name}</label><input className="form-input" placeholder="Arq. Juan Torres" value={form.nombre} onChange={e => update('nombre', e.target.value)} /></div>
              <div className="form-field"><label className="form-label">{i18n.f_email}</label><input className="form-input" type="email" placeholder="tu@despacho.mx" value={form.email} onChange={e => update('email', e.target.value)} /></div>
              <div className="form-field"><label className="form-label">{i18n.f_pass}</label><input className="form-input" type="password" placeholder={i18n.f_pass_ph} value={form.password} onChange={e => update('password', e.target.value)} autoComplete="new-password" /></div>
              <div className="form-field"><label className="form-label">{i18n.f_pass2}</label><input className="form-input" type="password" placeholder={i18n.f_pass2_ph} value={form.password2} onChange={e => update('password2', e.target.value)} autoComplete="new-password" /></div>
              {error && <p className="form-error">{error}</p>}
              <button className="btn-submit" onClick={step1Next} disabled={loading}>{loading ? i18n.loading : i18n.btn_continue}</button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-field"><label className="form-label">{i18n.f_firm}</label><input className="form-input" placeholder={i18n.f_firm_ph} value={form.despacho} onChange={e => update('despacho', e.target.value)} /></div>
              <div className="form-field"><label className="form-label">{i18n.f_city}</label><input className="form-input" placeholder={i18n.f_city_ph} value={form.ciudad} onChange={e => update('ciudad', e.target.value)} /></div>
              <div className="form-field"><label className="form-label">{i18n.f_tel}</label><input className="form-input" placeholder={i18n.f_tel_ph} value={form.tel} onChange={e => update('tel', e.target.value)} /></div>
              {error && <p className="form-error">{error}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={() => setStep(1)} style={{ padding: '14px 24px', background: 'transparent', color: 'var(--g500)', border: '1px solid var(--border)', fontFamily: 'Jost,sans-serif', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>{i18n.btn_back}</button>
                <button className="btn-submit" style={{ flex: 1, marginTop: 0 }} onClick={() => { setError(''); if (!form.despacho) { setError(i18n.err_firm_required); return } setStep(3) }}>{i18n.btn_continue}</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ background: 'var(--paper)', padding: '20px 24px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{planInfo.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--g400)', marginTop: 2 }}>{planInfo.limit}</div>
                  </div>
                  <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 28, fontWeight: 400, color: 'var(--ink)' }}>{planInfo.price}</div>
                </div>
              </div>

              {/* T&C resumen + checkbox */}
              <div style={{ marginBottom: 24 }}>
                <label className="form-label">{i18n.tc_label}</label>
                <div style={{ height: 140, overflowY: 'scroll', border: '1px solid var(--border)', padding: 16, fontSize: 11, fontWeight: 300, color: 'var(--g500)', lineHeight: 1.8, marginBottom: 12 }}>
                  <p style={{ fontWeight: 500, color: 'var(--ink)', marginBottom: 10, fontSize: 12 }}>{i18n.tc_short_intro}</p>
                  <p>
                    {lang === 'en'
                      ? 'This is a summary. Read the full Terms and Privacy Notice using the links below.'
                      : 'Este es un resumen. Lee los Términos completos y el Aviso de Privacidad usando los enlaces abajo.'}
                  </p>
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
                  <input type="checkbox" checked={tcAccepted} onChange={e => setTcAccepted(e.target.checked)} style={{ marginTop: 3, width: 15, height: 15, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--ink)' }} />
                  <span style={{ fontSize: 12, fontWeight: 300, color: 'var(--ink)', lineHeight: 1.6 }}>
                    {i18n.tc_accept_pre}
                    <button type="button" onClick={onShowTerms} style={{ background: 'none', border: 'none', color: 'var(--ink)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500, padding: 0, fontSize: 'inherit', fontFamily: 'inherit' }}>{i18n.tc_accept_terms}</button>
                    {i18n.tc_accept_and}
                    <button type="button" onClick={onShowPrivacy} style={{ background: 'none', border: 'none', color: 'var(--ink)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500, padding: 0, fontSize: 'inherit', fontFamily: 'inherit' }}>{i18n.tc_accept_priv}</button>
                    {i18n.tc_accept_post}
                  </span>
                </label>
              </div>

              {/* Coupon */}
              <div className="form-field" style={{ marginBottom: 16 }}>
                <label className="form-label">{i18n.coupon_label}</label>
                <input className="form-input" placeholder={i18n.coupon_ph} value={coupon} onChange={e => setCoupon(e.target.value)} style={{ textTransform: 'uppercase' }} />
              </div>

              {/* Pago seguro Stripe */}
              <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', padding: '20px 24px', marginBottom: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
                <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>{i18n.pay_secure}</p>
                <p style={{ fontSize: 12, fontWeight: 300, color: 'var(--g400)', margin: 0 }}>{i18n.pay_redirect}</p>
              </div>
              {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ padding: '14px 24px', background: 'transparent', color: 'var(--g500)', border: '1px solid var(--border)', fontFamily: 'Jost,sans-serif', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>{i18n.btn_back}</button>
                <button className="btn-submit" style={{ flex: 1, marginTop: 0 }} onClick={complete} disabled={loading}>{loading ? i18n.loading : i18n.btn_activate}</button>
              </div>
            </>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 56, height: 56, background: 'var(--g100)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>✓</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 32, fontWeight: 400, color: 'var(--ink)', marginBottom: 10 }}>{i18n.activated_title}</h3>
              <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--g400)', lineHeight: 1.7, marginBottom: 32 }}>{i18n.activated_desc}</p>
              <button className="btn-submit" onClick={onSuccess} style={{ maxWidth: 300, margin: '0 auto' }}>{i18n.activated_btn}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
