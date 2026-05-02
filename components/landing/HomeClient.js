'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Nav from '@/components/landing/Nav'
import LoginModal from '@/components/landing/LoginModal'
import RegisterModal from '@/components/landing/RegisterModal'
import TermsModal from '@/components/landing/TermsModal'
import PrivacyModal from '@/components/landing/PrivacyModal'
import Portal from '@/components/portal/Portal'
import MasterPanel from '@/components/master/MasterPanel'
import { getPlansForLanding } from '@/lib/plans'

export default function HomeClient() {
  const [lang, setLang] = useState('es')
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('mensual')
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [isMaster, setIsMaster] = useState(false)
  const [clientProjectData, setClientProjectData] = useState(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentCancelled, setPaymentCancelled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true)
      window.history.replaceState({}, '', '/')
      setTimeout(() => setPaymentSuccess(false), 8000)
    }
    if (params.get('payment') === 'cancelled') {
      setPaymentCancelled(true)
      window.history.replaceState({}, '', '/')
      setTimeout(() => setPaymentCancelled(false), 6000)
    }
    if (params.get('lang') === 'en') setLang('en')
  }, [])

  const t = {
    es: {
      eyebrow: 'Portal para despachos de arquitectura y construcción',
      h1: 'Tus clientes ven el avance. Tú trabajas tranquilo.',
      desc: 'ArchPortal le da a tus clientes acceso 24/7 al avance, fotos, costos y cronograma de su obra. Sin más mensajes de "¿cómo va lo mío?" cada semana.',
      cta1: 'Empezar prueba gratis',
      cta2: 'Ver demo (3 min)',
      stat1Num: '10 min', stat1Label: 'Listo para usar',
      stat2Num: '24/7',   stat2Label: 'Acceso siempre',
      stat3Num: '7 días', stat3Label: 'Garantía total',
      paySuccess: '¡Pago exitoso! Tu cuenta está activa. Ya puedes entrar al portal.',
      payCancelled: 'Pago cancelado. No se cobró nada. Si tienes dudas, escríbenos.',
      enterPortal: 'Entrar al portal',
      queEsLabel: '¿Qué es ArchPortal?',
      queEsH2: 'Un portal que alimentas una vez, tu cliente consulta siempre',
      queEsDesc:
        'El arquitecto actualiza el sistema cada semana. El cliente lo consulta cuando quiera, desde cualquier dispositivo.',
      features: [
        { num: '01', title: 'Dashboard en tiempo real', desc: 'Avance por etapa, presupuesto, gastos y entrega estimada visible para el cliente en todo momento.' },
        { num: '02', title: 'Bitácora visual', desc: 'Sube fotos de avance de obra. El cliente ve la evolución de su proyecto semana a semana.' },
        { num: '03', title: 'Control de costos', desc: 'Registra gastos por categoría y etapa. El cliente ve exactamente en qué se gasta su presupuesto.' },
        { num: '04', title: 'Soporte con IA', desc: 'El asistente responde preguntas del cliente usando la información del proyecto. Si no sabe, te notifica.' },
      ],
      whyLabel: 'Por qué existe',
      whyH2: 'Hecho por un arquitecto, para arquitectos',
      whyP1:
        'ArchPortal nació en una obra real, en Ensenada, después de contestar el "¿cómo va mi obra?" por WhatsApp por décima vez en una semana.',
      whyP2:
        'Los clientes querían visibilidad. El arquitecto quería trabajar tranquilo. Esto es lo que armamos — y ahora lo compartimos con otros despachos que viven el mismo problema.',
      whyP3: 'Si manejas entre 1 y 20 proyectos al año y estás cansado del caos, esto es para ti.',
      pricingLabel: 'Planes',
      pricingH2: 'Comienza hoy',
      pricingTrust: '7 días gratis · Cancelas cuando quieras · Sin permanencia',
      comenzar: 'Comenzar',
      contactLabel: 'Contacto',
      contactH2: 'Hablemos',
      contactDesc: 'Tienes preguntas o quieres una demo personalizada para tu despacho.',
      footerTagline: 'Portal de gestión para despachos de arquitectura y construcción.',
      footerLinks: { producto: 'Producto', recursos: 'Recursos', legal: 'Legal' },
      comoFuncionaLabel: '¿Cómo funciona?',
      comoFuncionaH2: 'Tres minutos para entenderlo todo',
      comoFuncionaDesc: 'Un recorrido completo por el portal desde la perspectiva del arquitecto y del cliente.',
      comoFuncionaItems: [
        'Arquitecto actualiza el portal',
        'Cliente consulta en tiempo real',
        'IA responde preguntas automáticamente',
        'Notificaciones cuando algo es urgente',
      ],
      tickerItems: [
        'Bitácora visual', 'Archivos y planos', 'Multi-proyecto', 'Dashboard en tiempo real',
        'Control de costos', 'Cronograma de obra', 'Notificaciones automáticas',
        'Soporte con IA', 'Transparencia total', 'Acceso 24/7',
      ],
      mosaicH2: 'Cubre todo el ciclo del proyecto',
      mosaicH2Em: 'del proyecto',
      mosaicItems: [
        { src: '/img1.jpg', num: '01', label: 'Diseño arquitectónico' },
        { src: '/img2.jpg', num: '02', label: 'Seguimiento de obra' },
        { src: '/img3.jpg', num: '03', label: 'Documentación' },
        { src: '/img4.jpg', num: '04', label: 'Presupuesto' },
      ],
    },
    en: {
      eyebrow: 'Portal for architecture and construction firms',
      h1: 'Your clients see progress. You work in peace.',
      desc: 'ArchPortal gives your clients 24/7 access to progress, photos, costs and schedule. No more "how is my project going" messages every week.',
      cta1: 'Start free trial',
      cta2: 'Watch demo (3 min)',
      stat1Num: '10 min', stat1Label: 'Setup time',
      stat2Num: '24/7',   stat2Label: 'Always-on access',
      stat3Num: '7 days', stat3Label: 'Money back',
      paySuccess: 'Payment successful! Your account is active. You can enter the portal now.',
      payCancelled: 'Payment cancelled. No charge was made. Contact us if you have questions.',
      enterPortal: 'Enter portal',
      queEsLabel: 'What is ArchPortal',
      queEsH2: 'A portal you update once, your client checks always',
      queEsDesc: 'The architect updates the system each week. The client checks anytime, from any device.',
      features: [
        { num: '01', title: 'Real-time dashboard', desc: 'Stage progress, budget, expenses and estimated delivery visible to the client at all times.' },
        { num: '02', title: 'Visual log', desc: 'Upload progress photos. The client sees the evolution of their project week by week.' },
        { num: '03', title: 'Cost control', desc: 'Log expenses by category and stage. The client sees exactly where their budget goes.' },
        { num: '04', title: 'AI support', desc: 'The assistant answers client questions using project information. If it cannot, it notifies you.' },
      ],
      whyLabel: 'Why it exists',
      whyH2: 'Built by an architect, for architects',
      whyP1:
        'ArchPortal was born on a real construction site, in Ensenada, after answering "how is my project going?" on WhatsApp for the tenth time in a week.',
      whyP2:
        'The clients wanted visibility. The architect wanted to work in peace. This is what we built — and now we share it with other firms living the same problem.',
      whyP3: 'If you manage 1 to 20 projects a year and you are tired of the chaos, this is for you.',
      pricingLabel: 'Plans',
      pricingH2: 'Start today',
      pricingTrust: '7-day guarantee · Cancel anytime · No commitment',
      comenzar: 'Get started',
      contactLabel: 'Contact',
      contactH2: "Let's talk",
      contactDesc: 'Have questions or want a personalized demo for your firm.',
      footerTagline: 'Management portal for architecture and construction firms.',
      footerLinks: { producto: 'Product', recursos: 'Resources', legal: 'Legal' },
      comoFuncionaLabel: 'How it works',
      comoFuncionaH2: 'Three minutes to understand it all',
      comoFuncionaDesc: 'A complete walkthrough of the portal from the architect and client perspective.',
      comoFuncionaItems: [
        'Architect updates the portal',
        'Client checks in real time',
        'AI answers questions automatically',
        'Notifications when something is urgent',
      ],
      tickerItems: [
        'Visual log', 'Plans & files', 'Multi-project', 'Real-time dashboard',
        'Cost control', 'Project schedule', 'Automatic notifications',
        'AI support', 'Full transparency', '24/7 access',
      ],
      mosaicH2: 'Covers the entire project cycle',
      mosaicH2Em: 'project cycle',
      mosaicItems: [
        { src: '/img1.jpg', num: '01', label: 'Architectural design' },
        { src: '/img2.jpg', num: '02', label: 'Construction tracking' },
        { src: '/img3.jpg', num: '03', label: 'Documentation' },
        { src: '/img4.jpg', num: '04', label: 'Budget' },
      ],
    },
  }[lang]

  const plans = getPlansForLanding(lang)

  const handleLogin = async (userData, userProjects, clientProject) => {
    if (userData.role === 'master') {
      setIsMaster(true)
      setUser(userData)
      setShowLogin(false)
      return
    }
    if (userData.role === 'cli' && clientProject) {
      const res = await fetch(`/api/projects?id=${clientProject.id}`)
      const data = await res.json()
      setUser(userData)
      setProjects([data.project || clientProject])
      setClientProjectData(data)
      setShowLogin(false)
      return
    }
    setUser(userData)
    setProjects(userProjects || [])
    setShowLogin(false)
  }

  const handleLogout = () => { setUser(null); setProjects([]); setIsMaster(false) }

  const handleImpersonate = async (arqUser) => {
    const res = await fetch(`/api/projects?user_id=${arqUser.id}`)
    const data = await res.json()
    setUser({ ...arqUser, impersonated: true })
    setProjects(data.projects || [])
    setIsMaster(false)
  }

  if (isMaster) return <MasterPanel onImpersonate={handleImpersonate} onLogout={handleLogout} />
  if (user) return <Portal user={user} projects={projects} onLogout={handleLogout} lang={lang} clientProjectData={clientProjectData} />

  const startTrial = () => { setSelectedPlan('mensual'); setShowRegister(true) }

  return (
    <>
      <Nav onLogin={() => setShowLogin(true)} lang={lang} setLang={setLang} />

      {paymentSuccess && (
        <div role="status" style={{ position:'fixed', top:0, left:0, right:0, zIndex:9999, background:'#2D5016', color:'#fff', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>✓</span>
          <div><div style={{ fontSize:14, fontWeight:500 }}>{t.paySuccess}</div></div>
          <button onClick={() => setShowLogin(true)} style={{ marginLeft:16, padding:'8px 20px', background:'rgba(255,255,255,.2)', border:'1px solid rgba(255,255,255,.4)', color:'#fff', fontFamily:'Jost,sans-serif', fontSize:11, letterSpacing:'.08em', textTransform:'uppercase', cursor:'pointer' }}>{t.enterPortal}</button>
        </div>
      )}

      {paymentCancelled && (
        <div role="status" style={{ position:'fixed', top:0, left:0, right:0, zIndex:9999, background:'#7A4A00', color:'#fff', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
          <span style={{ fontSize:18 }}>!</span>
          <div style={{ fontSize:14, fontWeight:400 }}>{t.payCancelled}</div>
        </div>
      )}

      {/* HERO */}
      <section className="hero">
        <Image
          src="/hero.jpg"
          alt="Arquitecto revisando avances de obra desde su laptop"
          fill
          priority
          sizes="100vw"
          style={{ objectFit:'cover', zIndex:0 }}
        />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(12,12,12,.78) 0%, rgba(12,12,12,.35) 100%)', zIndex:1 }} />
        <div className="hero-content">
          <span className="hero-eyebrow">{t.eyebrow}</span>
          <h1 className="hero-h1">{t.h1}</h1>
          <p className="hero-desc">{t.desc}</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={startTrial}>{t.cta1}</button>
            <button className="btn-ghost" onClick={() => document.getElementById('video-sec')?.scrollIntoView({ behavior:'smooth' })}>{t.cta2}</button>
          </div>
        </div>

        {/* HERO STATS — números grandes Cormorant + label pequeño */}
        <div className="hero-stats">
          <div className="stat-card">
            <div className="stat-card-num">{t.stat1Num}</div>
            <div className="stat-card-cap">{t.stat1Label}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-num">{t.stat2Num}</div>
            <div className="stat-card-cap">{t.stat2Label}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-num">{t.stat3Num}</div>
            <div className="stat-card-cap">{t.stat3Label}</div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div style={{ background:'var(--ink)', overflow:'hidden', borderTop:'1px solid rgba(255,255,255,.08)', borderBottom:'1px solid rgba(255,255,255,.08)', padding:'14px 0', position:'relative' }}>
        <style>{`
          @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .ticker-track { display:flex; width:max-content; animation: ticker 28s linear infinite; }
          .ticker-track:hover { animation-play-state: paused; }
          @media (prefers-reduced-motion: reduce) { .ticker-track { animation: none; } }
        `}</style>
        <div className="ticker-track" aria-hidden="true">
          {[...Array(2)].map((_, rep) => (
            <div key={rep} style={{ display:'flex', alignItems:'center', gap:0, flexShrink:0 }}>
              {(t.tickerItems || []).map((item, i) => (
                <span key={i} style={{ display:'flex', alignItems:'center', gap:0 }}>
                  <span style={{ fontSize:11, fontWeight:400, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.55)', padding:'0 32px', whiteSpace:'nowrap' }}>{item}</span>
                  <span style={{ width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,.2)', flexShrink:0 }} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* QUE ES */}
      <section id="que-es" className="section" style={{ background:'var(--white)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'start' }} className="mobile-1col">
          <div>
            <span className="section-label">{t.queEsLabel}</span>
            <h2 className="section-h2">{t.queEsH2}</h2>
            <p style={{ marginTop:16, fontSize:15, fontWeight:300, color:'var(--g500)', lineHeight:1.8 }}>{t.queEsDesc}</p>
          </div>
          <div>
            {t.features.map(f => (
              <div key={f.num} style={{ display:'flex', gap:24, padding:'24px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:10, letterSpacing:'.1em', color:'var(--g300)', marginTop:4, flexShrink:0 }}>{f.num}</div>
                <div>
                  <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:400, color:'var(--ink)', marginBottom:8 }}>{f.title}</div>
                  <div style={{ fontSize:13, fontWeight:300, color:'var(--g500)', lineHeight:1.8 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="video-sec" className="section" style={{ borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }} className="mobile-1col">
          <div>
            <span className="section-label">{t.comoFuncionaLabel}</span>
            <h2 className="section-h2">{t.comoFuncionaH2}</h2>
            <p style={{ marginTop:16, fontSize:14, fontWeight:300, color:'var(--g500)', lineHeight:1.8, marginBottom:40 }}>{t.comoFuncionaDesc}</p>
            {(t.comoFuncionaItems || []).map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--g300)', flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:300, color:'var(--g600)' }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ position:'relative', paddingBottom:'56.25%', height:0, overflow:'hidden', background:'var(--ink)' }}>
            <iframe
              loading="lazy"
              src="https://www.youtube.com/embed/-f9nZ8APZjo"
              title="ArchPortal — Cómo funciona"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}
            />
          </div>
        </div>
      </section>

      {/* POR QUE EXISTE — ahora con SVG arquitectónico, sin foto personal */}
      <section id="por-que" className="section" style={{ background:'var(--paper)', borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }} className="mobile-1col">
          <div>
            <span className="section-label">{t.whyLabel}</span>
            <h2 className="section-h2">{t.whyH2}</h2>
            <p style={{ marginTop:24, fontSize:15, fontWeight:300, color:'var(--g600)', lineHeight:1.9 }}>{t.whyP1}</p>
            <p style={{ marginTop:16, fontSize:15, fontWeight:300, color:'var(--g600)', lineHeight:1.9 }}>{t.whyP2}</p>
            <p style={{ marginTop:16, fontSize:14, fontWeight:400, color:'var(--ink)', lineHeight:1.8, fontStyle:'italic' }}>{t.whyP3}</p>
          </div>
          <div className="why-illustration">
            <img
              src="/archportal-hero.svg"
              alt="Ilustración arquitectónica — sección de proyecto"
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
            />
          </div>
        </div>
      </section>

      {/* MOSAICO */}
      <div style={{ background:'#F0EFEC', padding:'80px 48px' }}>
        <div style={{ marginBottom:40 }}>
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:48, fontWeight:300, color:'var(--ink)' }}>
            {t.mosaicH2.replace(t.mosaicH2Em, '')}<em style={{ fontStyle:'italic' }}>{t.mosaicH2Em}</em>
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'260px 260px', gap:8, maxWidth:900, margin:'0 auto' }}>
          {t.mosaicItems.map((img, i) => (
            <div key={i} style={{ position:'relative', overflow:'hidden' }}>
              <Image src={img.src} alt={img.label} fill sizes="(max-width: 900px) 50vw, 450px" style={{ objectFit:'cover' }} />
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 14px', background:'linear-gradient(to top, rgba(12,12,12,.8) 0%, transparent 100%)' }}>
                <div style={{ fontSize:9, letterSpacing:'.15em', textTransform:'uppercase', color:'rgba(255,255,255,.5)', marginBottom:2 }}>{img.num}</div>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16, fontWeight:400, color:'#fff', lineHeight:1.2 }}>{img.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <section id="precios" className="pricing-section">
        <span className="section-label">{t.pricingLabel}</span>
        <h2 className="section-h2">{t.pricingH2}</h2>
        <p style={{ marginTop:16, fontSize:14, color:'rgba(255,255,255,.55)', textAlign:'center' }}>{t.pricingTrust}</p>
        <div className="pricing-grid">
          {plans.map(plan => (
            <div key={plan.key} className={`pcard ${plan.featured ? 'featured' : ''}`}>
              {plan.badge && <div className="pcard-badge">{plan.badge}</div>}
              <span className="pcard-label">{plan.label}</span>
              <div className="pcard-price">{plan.price}</div>
              <span className="pcard-period">{plan.period}</span>
              <ul className="pcard-features">{plan.features.map((f, i) => <li key={i}>{f}</li>)}</ul>
              <button className={`btn-plan ${plan.featured ? '' : 'outline'}`} onClick={() => { setSelectedPlan(plan.key); setShowRegister(true) }}>{t.comenzar}</button>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contacto" className="section" style={{ borderTop:'1px solid var(--border)' }}>
        <span className="section-label">{t.contactLabel}</span>
        <h2 className="section-h2">{t.contactH2}</h2>
        <p style={{ marginTop:16, fontSize:15, fontWeight:300, color:'var(--g500)', lineHeight:1.8 }}>{t.contactDesc}</p>
        <a href="mailto:lcarq01@gmail.com" style={{ display:'inline-flex', alignItems:'center', gap:10, marginTop:20, marginBottom:8, fontSize:15, color:'var(--ink)', fontWeight:400, textDecoration:'none', borderBottom:'1px solid var(--ink)', paddingBottom:2 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" /></svg>
          lcarq01@gmail.com
        </a>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">ArchPortal</div>
            <p className="footer-tagline">{t.footerTagline}</p>
          </div>
          <div>
            <div className="footer-col-title">{t.footerLinks.producto}</div>
            <ul className="footer-links">
              <li><button onClick={() => document.getElementById('que-es')?.scrollIntoView({ behavior:'smooth' })}>Dashboard</button></li>
              <li><button onClick={() => document.getElementById('precios')?.scrollIntoView({ behavior:'smooth' })}>{lang === 'en' ? 'Pricing' : 'Precios'}</button></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">{t.footerLinks.recursos}</div>
            <ul className="footer-links">
              <li><button onClick={() => setShowLogin(true)}>Portal</button></li>
              <li><button onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior:'smooth' })}>{lang === 'en' ? 'Support' : 'Soporte'}</button></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">{t.footerLinks.legal}</div>
            <ul className="footer-links">
              <li><button onClick={() => setShowTerms(true)}>{lang === 'en' ? 'Terms of use' : 'Términos de uso'}</button></li>
              <li><button onClick={() => setShowPrivacy(true)}>{lang === 'en' ? 'Privacy notice' : 'Aviso de privacidad'}</button></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ArchPortal</span>
          <span>archportal.net</span>
        </div>
      </footer>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} onRegister={() => { setShowLogin(false); setShowRegister(true) }} lang={lang} />}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} plan={selectedPlan} onSuccess={() => { setShowRegister(false); setShowLogin(true) }} lang={lang} onShowTerms={() => setShowTerms(true)} onShowPrivacy={() => setShowPrivacy(true)} />}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </>
  )
}
