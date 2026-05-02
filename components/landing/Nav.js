'use client'
import { useState, useEffect } from 'react'

export default function Nav({ onLogin, lang, setLang }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMenuOpen(false)
  }

  const handleLoginClick = () => {
    onLogin()
    setMenuOpen(false)
  }

  const t = {
    es: { queEs: '¿Qué es?', comoFunciona: 'Cómo funciona', precios: 'Precios', contacto: 'Contacto', cliente: 'Área de cliente' },
    en: { queEs: 'What is it', comoFunciona: 'How it works', precios: 'Pricing', contacto: 'Contact', cliente: 'Client area' }
  }[lang] || {}

  return (
    <>
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ArchPortal
        </div>

        <div className="nav-links" style={{ display: 'flex' }}>
          <button className="nav-link" onClick={() => navTo('que-es')}>{t.queEs}</button>
          <button className="nav-link" onClick={() => navTo('video-sec')}>{t.comoFunciona}</button>
          <button className="nav-link" onClick={() => navTo('precios')}>{t.precios}</button>
          <button className="nav-link" onClick={() => navTo('contacto')}>{t.contacto}</button>

          <div className="lang-toggle">
            <button onClick={() => setLang('es')} className={`lang-btn ${lang === 'es' ? 'active' : ''}`}>ES</button>
            <button onClick={() => setLang('en')} className={`lang-btn ${lang === 'en' ? 'active' : ''}`}>EN</button>
          </div>

          <button className="nav-cta" onClick={onLogin}>{t.cliente}</button>
        </div>

        {/* Hamburger button - mobile only */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'none' }}
          className="nav-hamburger"
          aria-label="Menu"
          aria-expanded={menuOpen}>
          <span style={{ display: 'block', width: 22, height: 2, background: scrolled ? 'var(--ink)' : '#fff', marginBottom: 5, transition: 'all .3s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: scrolled ? 'var(--ink)' : '#fff', transition: 'all .3s', opacity: menuOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: scrolled ? 'var(--ink)' : '#fff', marginTop: 5, transition: 'all .3s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, zIndex: 490, background: 'rgba(12,12,12,.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {['que-es', 'video-sec', 'precios', 'contacto'].map((id, i) => (
            <button key={id} onClick={() => navTo(id)} style={{ background: 'none', border: 'none', color: '#fff', fontFamily: 'Cormorant Garamond,serif', fontSize: 32, fontWeight: 300, cursor: 'pointer', padding: 12 }}>
              {[t.queEs, t.comoFunciona, t.precios, t.contacto][i]}
            </button>
          ))}
          <button
            onClick={handleLoginClick}
            style={{ marginTop: 16, padding: '14px 40px', background: '#fff', color: '#0C0C0C', border: 'none', fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
            {t.cliente}
          </button>
        </div>
      )}
    </>
  )
}
