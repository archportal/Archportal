'use client'
import { useState } from 'react'
import Nav from '@/components/landing/Nav'
import LoginModal from '@/components/landing/LoginModal'
import RegisterModal from '@/components/landing/RegisterModal'
import TermsModal from '@/components/landing/TermsModal'
import Portal from '@/components/portal/Portal'
import MasterPanel from '@/components/master/MasterPanel'

export default function Home() {
  const [lang, setLang] = useState('es')
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('mensual')
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [isMaster, setIsMaster] = useState(false)

  const t = {
    es: {
      eyebrow:'Portal para despachos de arquitectura y construccion',
      h1:'ArchPortal conecta a arquitectos y clientes en tiempo real.',
      desc:'Avances, costos, planos y soporte inteligente en un solo lugar.',
      cta1:'Entrar al portal', cta2:'Conocer mas',
      s1label:'Minutos de setup', s1val:'3', s2label:'Transparencia', s2val:'100%', s3label:'Malentendidos', s3val:'0',
      queEsLabel:'Que es ArchPortal',
      queEsH2:'Un portal que alimentas una vez, tu cliente consulta siempre',
      queEsDesc:'El arquitecto actualiza el sistema cada semana. El cliente lo consulta cuando quiera, desde cualquier dispositivo.',
      features:[
        {num:'01',title:'Dashboard en tiempo real',desc:'Avance por etapa, presupuesto, gastos y entrega estimada visible para el cliente en todo momento.'},
        {num:'02',title:'Bitacora visual',desc:'Sube fotos de avance de obra. El cliente ve la evolucion de su proyecto semana a semana.'},
        {num:'03',title:'Control de costos',desc:'Registra gastos por categoria y etapa. El cliente ve exactamente en que se gasta su presupuesto.'},
        {num:'04',title:'Soporte con IA',desc:'El asistente responde preguntas del cliente usando la informacion del proyecto. Si no sabe, te notifica.'}
      ],
      pricingLabel:'Planes', pricingH2:'Comienza hoy',
      plans:[
        {key:'mensual',label:'Mensual',price:'$120',period:'USD / mes',features:['1 proyecto activo','Portal cliente incluido','Soporte con IA','Bitacora visual','Control de costos'],featured:false},
        {key:'trimestral',label:'Trimestral',price:'$300',period:'USD / trimestre',features:['3 proyectos activos','Portal cliente incluido','Soporte con IA','Bitacora visual','Control de costos'],featured:true},
        {key:'anual',label:'Anual',price:'$1,100',period:'USD / año',features:['Proyectos ilimitados','Portal cliente incluido','Soporte con IA prioritario','Bitacora visual','Control de costos'],featured:false}
      ],
      comenzar:'Comenzar', contactLabel:'Contacto', contactH2:'Hablemos',
      contactDesc:'Tienes preguntas o quieres una demo personalizada para tu despacho.',
      footerTagline:'Portal de gestion para despachos de arquitectura y construccion.',
      footerLinks:{producto:'Producto',recursos:'Recursos',legal:'Legal'},
    },
    en: {
      eyebrow:'Portal for architecture and construction firms',
      h1:'ArchPortal connects architects and clients in real time.',
      desc:'Progress, costs, plans and smart support in one place.',
      cta1:'Enter portal', cta2:'Learn more',
      s1label:'Minutes of setup', s1val:'3', s2label:'Transparency', s2val:'100%', s3label:'Misunderstandings', s3val:'0',
      queEsLabel:'What is ArchPortal',
      queEsH2:'A portal you update once, your client checks always',
      queEsDesc:'The architect updates the system each week. The client checks anytime, from any device.',
      features:[
        {num:'01',title:'Real-time dashboard',desc:'Stage progress, budget, expenses and estimated delivery visible to the client at all times.'},
        {num:'02',title:'Visual log',desc:'Upload progress photos. The client sees the evolution of their project week by week.'},
        {num:'03',title:'Cost control',desc:'Log expenses by category and stage. The client sees exactly where their budget goes.'},
        {num:'04',title:'AI support',desc:'The assistant answers client questions using project information. If it cannot, it notifies you.'}
      ],
      pricingLabel:'Plans', pricingH2:'Start today',
      plans:[
        {key:'monthly',label:'Monthly',price:'$120',period:'USD / month',features:['1 active project','Client portal included','AI support','Visual log','Cost control'],featured:false},
        {key:'quarterly',label:'Quarterly',price:'$300',period:'USD / quarter',features:['3 active projects','Client portal included','AI support','Visual log','Cost control'],featured:true},
        {key:'annual',label:'Annual',price:'$1,100',period:'USD / year',features:['Unlimited projects','Client portal included','Priority AI support','Visual log','Cost control'],featured:false}
      ],
      comenzar:'Get started', contactLabel:'Contact', contactH2:"Let's talk",
      contactDesc:'Have questions or want a personalized demo for your firm.',
      footerTagline:'Management portal for architecture and construction firms.',
      footerLinks:{producto:'Product',recursos:'Resources',legal:'Legal'},
    }
  }[lang]

  const handleLogin = async (userData, userProjects, clientProject) => {
    if (userData.role === 'master') {
      setIsMaster(true)
      setUser(userData)
      setShowLogin(false)
      return
    }
    // Client login - load their specific project
    if (userData.role === 'cli' && clientProject) {
      const res = await fetch(`/api/projects?id=${clientProject.id}`)
      const data = await res.json()
      setUser(userData)
      setProjects([data.project || clientProject])
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
  if (user) return <Portal user={user} projects={projects} onLogout={handleLogout} lang={lang} />

  return (
    <>
      <Nav onLogin={() => setShowLogin(true)} lang={lang} setLang={setLang} />

      {/* HERO */}
      <section className="hero">
        <img src="/hero.jpg" alt="arquitectura" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0}} />
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to right, rgba(12,12,12,.75) 0%, rgba(12,12,12,.3) 100%)',zIndex:1}} />
        <div className="hero-content">
          <span className="hero-eyebrow">{t.eyebrow}</span>
          <h1 className="hero-h1">{t.h1}</h1>
          <p className="hero-desc">{t.desc}</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={()=>setShowLogin(true)}>{t.cta1}</button>
            <button className="btn-ghost" onClick={()=>document.getElementById('que-es')?.scrollIntoView({behavior:'smooth'})}>{t.cta2}</button>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-item"><div className="stat-number">{t.s1val}</div><div className="stat-label">{t.s1label}</div></div>
          <div className="stat-item"><div className="stat-number">{t.s2val}</div><div className="stat-label">{t.s2label}</div></div>
          <div className="stat-item"><div className="stat-number">{t.s3val}</div><div className="stat-label">{t.s3label}</div></div>
        </div>
      </section>

      {/* TICKER */}
      <div style={{background:'var(--ink)',overflow:'hidden',borderTop:'1px solid rgba(255,255,255,.08)',borderBottom:'1px solid rgba(255,255,255,.08)',padding:'14px 0',position:'relative'}}>
        <style>{`
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .ticker-track {
            display: flex;
            width: max-content;
            animation: ticker 28s linear infinite;
          }
          .ticker-track:hover { animation-play-state: paused; }
        `}</style>
        <div className="ticker-track">
          {[...Array(2)].map((_,rep) => (
            <div key={rep} style={{display:'flex',alignItems:'center',gap:0,flexShrink:0}}>
              {['Bitácora visual','Archivos y planos','Multi-proyecto','Dashboard en tiempo real','Control de costos','Cronograma de obra','Notificaciones automáticas','Soporte con IA','Transparencia total','Acceso 24/7'].map((item,i) => (
                <span key={i} style={{display:'flex',alignItems:'center',gap:0}}>
                  <span style={{fontSize:11,fontWeight:400,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,.55)',padding:'0 32px',whiteSpace:'nowrap'}}>{item}</span>
                  <span style={{width:4,height:4,borderRadius:'50%',background:'rgba(255,255,255,.2)',flexShrink:0}}/>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* QUE ES */}
      <section id="que-es" className="section" style={{background:'var(--white)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:80,alignItems:'start'}}>
          <div>
            <span className="section-label">{t.queEsLabel}</span>
            <h2 className="section-h2">{t.queEsH2}</h2>
            <p style={{marginTop:16,fontSize:15,fontWeight:300,color:'var(--g500)',lineHeight:1.8}}>{t.queEsDesc}</p>
          </div>
          <div>
            {t.features.map(f=>(
              <div key={f.num} style={{display:'flex',gap:24,padding:'24px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontSize:10,letterSpacing:'.1em',color:'var(--g300)',marginTop:4,flexShrink:0}}>{f.num}</div>
                <div>
                  <div style={{fontFamily:'Cormorant Garamond, serif',fontSize:22,fontWeight:400,color:'var(--ink)',marginBottom:8}}>{f.title}</div>
                  <div style={{fontSize:13,fontWeight:300,color:'var(--g500)',lineHeight:1.8}}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="video-sec" className="section" style={{borderTop:'1px solid var(--border)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:80,alignItems:'center'}}>
          <div>
            <span className="section-label">Como funciona</span>
            <h2 className="section-h2">Tres minutos<br/>para <em>entenderlo todo</em></h2>
            <p style={{marginTop:16,fontSize:14,fontWeight:300,color:'var(--g500)',lineHeight:1.8,marginBottom:40}}>Un recorrido completo por el portal desde la perspectiva del arquitecto y del cliente.</p>
            {['Arquitecto actualiza el portal','Cliente consulta en tiempo real','IA responde preguntas automaticamente','Notificaciones cuando algo es urgente'].map((item,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'var(--g300)',flexShrink:0}}/>
                <span style={{fontSize:13,fontWeight:300,color:'var(--g600)'}}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{background:'var(--ink)',aspectRatio:'16/9',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,position:'relative',overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4,opacity:.15,position:'absolute',inset:20}}>
              {Array.from({length:8}).map((_,i)=><div key={i} style={{background:'var(--g400)',aspectRatio:'1'}}/>)}
            </div>
            <div style={{width:56,height:56,borderRadius:'50%',border:'2px solid rgba(255,255,255,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1}}>
              <div style={{width:0,height:0,borderTop:'10px solid transparent',borderBottom:'10px solid transparent',borderLeft:'16px solid rgba(255,255,255,.7)',marginLeft:4}}/>
            </div>
            <span style={{fontSize:10,letterSpacing:'.15em',textTransform:'uppercase',color:'rgba(255,255,255,.4)',zIndex:1}}>Video disponible pronto</span>
          </div>
        </div>
      </section>

      {/* MOSAICO */}
      <div style={{background:'#F0EFEC',padding:'80px 48px'}}>
        <div style={{marginBottom:40}}>
          <h2 style={{fontFamily:'Cormorant Garamond, serif',fontSize:48,fontWeight:300,color:'var(--ink)'}}>Pensado para <em style={{fontStyle:'italic'}}>todo tipo de obra</em></h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'260px 260px',gap:8,maxWidth:900,margin:'0 auto'}}>
          {[{src:'/img1.jpg',num:'01',label:'Diseño arquitectónico'},{src:'/img2.jpg',num:'02',label:'Seguimiento de obra'},{src:'/img3.jpg',num:'03',label:'Documentación'},{src:'/img4.jpg',num:'04',label:'Presupuesto'}].map((img,i)=>(
            <div key={i} style={{position:'relative',overflow:'hidden'}}>
              <img src={img.src} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={img.label}/>
              <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'20px 24px',background:'linear-gradient(to top, rgba(12,12,12,.8) 0%, transparent 100%)'}}>
                <div style={{fontSize:10,letterSpacing:'.15em',textTransform:'uppercase',color:'rgba(255,255,255,.5)',marginBottom:4}}>{img.num}</div>
                <div style={{fontFamily:'Cormorant Garamond, serif',fontSize:22,fontWeight:400,color:'#fff'}}>{img.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <section id="precios" className="pricing-section">
        <span className="section-label">{t.pricingLabel}</span>
        <h2 className="section-h2">{t.pricingH2}</h2>
        <div className="pricing-grid">
          {t.plans.map(plan=>(
            <div key={plan.key} className={`pcard ${plan.featured?'featured':''}`}>
              <span className="pcard-label">{plan.label}</span>
              <div className="pcard-price">{plan.price}</div>
              <span className="pcard-period">{plan.period}</span>
              <ul className="pcard-features">{plan.features.map((f,i)=><li key={i}>{f}</li>)}</ul>
              <button className={`btn-plan ${plan.featured?'':'outline'}`} onClick={()=>{setSelectedPlan(plan.key);setShowRegister(true)}}>{t.comenzar}</button>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contacto" className="section" style={{borderTop:'1px solid var(--border)'}}>
        <span className="section-label">{t.contactLabel}</span>
        <h2 className="section-h2">{t.contactH2}</h2>
        <p style={{marginTop:16,fontSize:15,fontWeight:300,color:'var(--g500)',lineHeight:1.8}}>{t.contactDesc}</p>
        <button className="btn-primary" style={{marginTop:32}} onClick={()=>setShowRegister(true)}>{t.comenzar}</button>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-grid">
          <div><div className="footer-brand">ArchPortal</div><p className="footer-tagline">{t.footerTagline}</p></div>
          <div>
            <div className="footer-col-title">{t.footerLinks.producto}</div>
            <ul className="footer-links">
              <li><a onClick={()=>document.getElementById('que-es')?.scrollIntoView({behavior:'smooth'})}>Dashboard</a></li>
              <li><a onClick={()=>document.getElementById('precios')?.scrollIntoView({behavior:'smooth'})}>Precios</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">{t.footerLinks.recursos}</div>
            <ul className="footer-links"><li><a onClick={()=>setShowLogin(true)}>Portal</a></li><li><a>Soporte</a></li></ul>
          </div>
          <div>
            <div className="footer-col-title">{t.footerLinks.legal}</div>
            <ul className="footer-links"><li><a onClick={()=>setShowTerms(true)}>Términos de uso</a></li><li><a>Privacidad</a></li></ul>
          </div>
        </div>
        <div className="footer-bottom"><span>© 2026 ArchPortal</span><span>archportal.mx</span></div>
      </footer>

      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onLogin={handleLogin} onRegister={()=>{setShowLogin(false);setShowRegister(true)}} lang={lang}/>}
      {showRegister && <RegisterModal onClose={()=>setShowRegister(false)} plan={selectedPlan} onSuccess={()=>{setShowRegister(false);setShowLogin(true)}} lang={lang}/>}
      {showTerms && <TermsModal onClose={()=>setShowTerms(false)}/>}
    </>
  )
}
