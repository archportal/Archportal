'use client'
import { useState } from 'react'
import { sendNotifEmail, sendBitacoraEmail } from '@/lib/emailjs'

// ===== Constantes visuales =====
const CARD_RADIUS = 12
const INPUT_RADIUS = 6
const BTN_RADIUS = 6

// ===== Íconos SVG =====
const IconChat = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const IconBrain = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2a3.5 3.5 0 0 0-3.5 3.5 3.5 3.5 0 0 0-2 6.3A3.5 3.5 0 0 0 6 18.5 3.5 3.5 0 0 0 9.5 22V2z"/>
    <path d="M14.5 2a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1 2 6.3A3.5 3.5 0 0 1 18 18.5 3.5 3.5 0 0 1 14.5 22V2z"/>
  </svg>
)
const IconBook = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)
const IconSparkles = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
    <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z"/>
  </svg>
)
const IconEmpty = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

export default function Soporte({ project, user, lang, onRefresh, isArq }) {
  const p = project?.project || project || {}
  const qInit = project?.questions || []
  const [questions, setQuestions] = useState(qInit)
  const [pregunta, setPregunta] = useState('')
  const [loading, setLoading] = useState(false)
  const [kbTema, setKbTema] = useState('')
  const [kbInfo, setKbInfo] = useState('')
  const [savingKb, setSavingKb] = useState(false)
  const [editingResp, setEditingResp] = useState({})
  const parseJson = (v) => { try { return typeof v==='string'?JSON.parse(v):(Array.isArray(v)?v:[]) } catch { return [] } }
  const kb = parseJson(p.knowledge_base)

  const buildContext = () => {
    const stages = project?.stages || []
    const avg = stages.length ? Math.round(stages.reduce((s,e)=>s+(e.porcentaje||0),0)/stages.length) : 0
    const kbText = kb.map(k=>`${k.tema}: ${k.info}`).join('\n')
    return `Eres el asistente del proyecto "${p.nombre}" ubicado en ${p.ubicacion}. El arquitecto es ${p.arquitecto}. Avance general: ${avg}%. Etapa actual: ${p.etapa_actual}. Presupuesto aprobado: $${(p.presupuesto||0).toLocaleString('es-MX')} MXN. Monto ejercido: $${(p.pres_ejercido||0).toLocaleString('es-MX')} MXN.${kbText?'\n\nInformación adicional del proyecto:\n'+kbText:''}\n\nPuedes responder dos tipos de preguntas:\n1. Preguntas sobre este proyecto específico: usa los datos del proyecto arriba.\n2. Preguntas generales de arquitectura, construcción, materiales, instalaciones, procesos constructivos, normativas o diseño: respóndelas con tu conocimiento general de manera clara y educativa.\n\nSi la pregunta es sobre el proyecto y no tienes el dato exacto, indica que el arquitecto responderá personalmente. Sé conciso, claro y profesional.`
  }

  const enviar = async () => {
    if (!pregunta.trim()) return
    setLoading(true)
    const q = pregunta
    const nuevaQ = { pregunta:q, respuesta:null, ia_respondio:false, created_at:new Date().toISOString() }
    setQuestions(prev => [nuevaQ, ...prev])
    setPregunta('')
    try {
      const apiKey = localStorage.getItem('master_anthropic_key') || ''
      const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ pregunta:q, projectId:p.id, context:buildContext(), apiKey }) })
      const data = await res.json()
      setQuestions(prev => prev.map((item,i) => i===0 ? { ...item, respuesta:data.respuesta||null, ia_respondio:data.iaRespondio } : item))
      if (!data.iaRespondio) {
        sendNotifEmail({ arquitectoEmail:p.architect_email||p.architectemail, arquitectoNombre:p.arquitecto, clienteNombre:p.cliente||user.email, clienteEmail:user.email, proyecto:p.nombre, pregunta:q })
      }
      const updatedQs = [{ pregunta:q, respuesta:data.respuesta||null, ia_respondio:data.iaRespondio||false }, ...qInit]
      await fetch('/api/projects', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:p.id, questions:updatedQs }) })
    } catch(e) { console.warn('AI error:',e) }
    finally { setLoading(false) }
  }

  const responder = async (i, texto) => {
    if (!texto.trim()) return
    const updated = [...questions]
    updated[i] = { ...updated[i], respuesta:texto, ia_respondio:false }
    setQuestions(updated)
    setEditingResp(prev => { const n={...prev}; delete n[i]; return n })
    await fetch('/api/projects', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:p.id, questions:updated }) })
    sendBitacoraEmail({ clientEmail:p.client_email, arquitectoNombre:user.name||user.email, arquitectoEmail:user.email, proyecto:p.nombre, cliente:p.cliente, nota:`Tu arquitecto respondió tu pregunta: "${updated[i].pregunta}"\n\nRespuesta: ${texto}` })
    onRefresh?.()
  }

  const deleteQuestion = async (i) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    const updated = questions.filter((_,idx) => idx !== i)
    setQuestions(updated)
    await fetch('/api/projects', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:p.id, questions:updated }) })
    onRefresh?.()
  }

  const addKb = async () => {
    if (!kbTema||!kbInfo) return
    setSavingKb(true)
    const newKb=[...kb,{tema:kbTema,info:kbInfo}]
    await fetch('/api/projects', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:p.id, knowledge_base:newKb }) })
    setKbTema(''); setKbInfo('')
    setSavingKb(false)
    onRefresh?.()
  }

  const cleanText = (t) => t?.replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1').replace(/`(.*?)`/g,'$1') || ''

  // Estilos reutilizables
  const inputStyle = {
    width:'100%',
    padding:'12px 14px',
    border:'1px solid var(--border)',
    borderRadius: INPUT_RADIUS,
    fontFamily:'Jost, sans-serif',
    fontSize:13,
    fontWeight:400,
    color:'var(--ink)',
    outline:'none',
    boxSizing:'border-box',
    background:'var(--white)',
  }
  const textareaStyle = { ...inputStyle, resize:'vertical', lineHeight:1.6 }

  return (
    <div>
      <style>{`
        .soporte-root .card { border-radius: ${CARD_RADIUS}px !important; overflow: hidden; }
        .soporte-root .section-hero { border-radius: ${CARD_RADIUS}px !important; overflow: hidden; }
        .soporte-root .chip { border-radius: 999px !important; }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      <div className="soporte-root">

      {/* HERO */}
      <div className="section-hero" style={{marginBottom:20}}>
        <div className="section-hero-eyebrow" style={{color:'var(--gold)',fontWeight:500}}>Proyecto · Asistencia</div>
        <h1 className="section-hero-title">Soporte</h1>
        <p className="section-hero-sub">
          {isArq
            ? 'Gestiona preguntas del cliente y base de conocimiento'
            : (lang==='en' ? 'Send your questions about the project' : 'Envía tus preguntas sobre el proyecto')}
        </p>
      </div>

      <div className={isArq ? 'two-col' : ''}>

        {/* ==================== PREGUNTAS ==================== */}
        <div className="card">
          <div className="card-title" style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{color:'var(--gold)',display:'inline-flex',flexShrink:0}}><IconChat /></span>
            <span>{isArq ? 'Preguntas del cliente' : (lang==='en' ? 'My questions' : 'Mis preguntas')}</span>
          </div>

          {questions.length===0 && (
            <div style={{padding:'40px 0',textAlign:'center'}}>
              <div style={{color:'var(--g300)',marginBottom:14,display:'inline-flex'}}><IconEmpty /></div>
              <p style={{fontSize:15,fontWeight:400,color:'var(--g500)',marginBottom:6}}>
                {isArq ? 'Sin preguntas del cliente' : 'Sin preguntas aún'}
              </p>
              <p style={{fontSize:12,color:'var(--g400)',fontWeight:300}}>
                {isArq
                  ? 'Cuando el cliente envíe una pregunta aparecerá aquí.'
                  : (lang==='en' ? 'Send your first question below.' : 'Escribe tu primera pregunta abajo.')}
              </p>
            </div>
          )}

          {questions.map((q,i) => (
            <div key={i} style={{padding:'20px 0',borderBottom: i === questions.length - 1 ? 'none' : '1px solid var(--g100)'}}>
              {/* Question */}
              <div style={{display:'flex',gap:12,marginBottom:12}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'var(--white)',flexShrink:0,letterSpacing:'.04em'}}>
                  {isArq ? 'CL' : 'TÚ'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6,gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:12,fontWeight:500,color:'var(--ink)'}}>
                      {isArq ? 'Cliente' : (lang==='en' ? 'Your question' : 'Tu pregunta')}
                    </span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:10,color:'var(--g400)',fontWeight:300}}>{new Date(q.created_at||Date.now()).toLocaleString('es-MX')}</span>
                      {isArq && (
                        <button onClick={()=>deleteQuestion(i)}
                          style={{fontSize:10,color:'var(--danger)',background:'transparent',border:'1px solid var(--danger)',borderRadius:BTN_RADIUS,padding:'3px 10px',cursor:'pointer',fontFamily:'Jost,sans-serif',flexShrink:0}}>✕</button>
                      )}
                    </div>
                  </div>
                  <p style={{fontSize:14,fontWeight:400,color:'var(--ink)',lineHeight:1.65,margin:0,whiteSpace:'pre-wrap'}}>{q.pregunta}</p>
                </div>
              </div>

              {/* Answer (ya respondida y no en edición) */}
              {q.respuesta && editingResp[i]===undefined ? (
                <div style={{
                  marginLeft:48,
                  background: q.ia_respondio ? 'rgba(197,164,109,0.08)' : 'var(--off)',
                  padding:'14px 18px',
                  borderLeft: `3px solid ${q.ia_respondio ? 'var(--gold)' : 'var(--ink)'}`,
                  borderRadius: 6,
                }}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,gap:8,flexWrap:'wrap'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      {q.ia_respondio && <span style={{color:'var(--gold)',display:'inline-flex'}}><IconSparkles /></span>}
                      <span style={{fontSize:10,letterSpacing:'.14em',textTransform:'uppercase',color: q.ia_respondio ? 'var(--gold)' : 'var(--g500)',fontWeight:600}}>
                        {q.ia_respondio ? 'Asistente IA' : (lang==='en' ? 'Architect' : 'Arquitecto')}
                      </span>
                    </div>
                    {isArq && (
                      <button onClick={()=>setEditingResp(prev=>({...prev,[i]:q.respuesta}))}
                        style={{fontSize:10,background:'transparent',border:'1px solid var(--border)',borderRadius:BTN_RADIUS,padding:'4px 12px',cursor:'pointer',fontFamily:'Jost,sans-serif',letterSpacing:'.06em',textTransform:'uppercase',color:'var(--g500)'}}>
                        Editar
                      </button>
                    )}
                  </div>
                  <p style={{fontSize:14,fontWeight:400,color:'var(--ink)',lineHeight:1.7,margin:0,whiteSpace:'pre-wrap'}}>{cleanText(q.respuesta)}</p>
                </div>
              ) : isArq ? (
                /* Editor de respuesta del arquitecto */
                <div style={{marginLeft:48}}>
                  <textarea value={editingResp[i]!==undefined?editingResp[i]:''} onChange={e=>setEditingResp(prev=>({...prev,[i]:e.target.value}))}
                    placeholder="Escribe tu respuesta..." rows={3}
                    style={textareaStyle}/>
                  <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                    <button onClick={()=>responder(i, editingResp[i]||'')}
                      style={{padding:'9px 22px',background:'var(--ink)',color:'var(--white)',border:'none',borderRadius:BTN_RADIUS,fontFamily:'Jost,sans-serif',fontSize:11,fontWeight:500,letterSpacing:'.08em',textTransform:'uppercase',cursor:'pointer'}}>
                      {q.respuesta ? 'Actualizar y notificar' : 'Responder y notificar'}
                    </button>
                    {q.respuesta && (
                      <button onClick={()=>setEditingResp(prev=>{const n={...prev};delete n[i];return n})}
                        style={{padding:'9px 16px',background:'transparent',border:'1px solid var(--border)',borderRadius:BTN_RADIUS,fontFamily:'Jost,sans-serif',fontSize:11,color:'var(--g500)',cursor:'pointer',letterSpacing:'.06em',textTransform:'uppercase'}}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Estado "pendiente" para el cliente */
                <div style={{marginLeft:48,background:'var(--paper)',padding:'14px 18px',borderLeft:'3px solid var(--g200)',borderRadius:6}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,flexWrap:'wrap'}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,color:'var(--white)',flexShrink:0}}>
                      {(p.arquitecto||'A').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}
                    </div>
                    <span style={{fontSize:12,fontWeight:500,color:'var(--ink)'}}>{p.arquitecto || 'Tu arquitecto'}</span>
                    <span style={{fontSize:9,padding:'3px 10px',background:'var(--warn-bg)',color:'var(--warn)',letterSpacing:'.1em',textTransform:'uppercase',fontWeight:600,borderRadius:999}}>Pendiente</span>
                  </div>
                  <p style={{fontSize:13,fontWeight:400,color:'var(--g600)',lineHeight:1.65,margin:0}}>
                    {lang==='en'
                      ? `${p.arquitecto||'Your architect'} has been notified and will respond to you personally as soon as possible.`
                      : `${p.arquitecto||'Tu arquitecto'} fue notificado y te responderá personalmente a la brevedad.`}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Formulario del cliente para enviar nueva pregunta */}
          {!isArq && (
            <div style={{marginTop:20, paddingTop:questions.length>0?20:0, borderTop:questions.length>0?'1px solid var(--border)':'none'}}>
              <label style={{fontSize:10,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:8,display:'block',fontWeight:600}}>
                {lang==='en' ? 'New question' : 'Nueva pregunta'}
              </label>
              <textarea
                placeholder={lang==='en' ? 'Write your question...' : 'Escribe tu pregunta sobre el proyecto...'}
                value={pregunta}
                onChange={e=>setPregunta(e.target.value)}
                rows={3}
                style={textareaStyle}
              />
              <button onClick={enviar} disabled={loading||!pregunta.trim()}
                style={{
                  marginTop:10,
                  padding:'11px 22px',
                  background: loading||!pregunta.trim() ? 'var(--g200)' : 'var(--ink)',
                  color: loading||!pregunta.trim() ? 'var(--g400)' : 'var(--white)',
                  border:'none',
                  borderRadius: BTN_RADIUS,
                  fontFamily:'Jost,sans-serif',
                  fontSize:11,
                  fontWeight:600,
                  letterSpacing:'.1em',
                  textTransform:'uppercase',
                  cursor: loading||!pregunta.trim() ? 'not-allowed' : 'pointer',
                }}>
                {loading ? (
                  <span style={{display:'inline-flex',alignItems:'center',gap:8}}>
                    <span style={{width:12,height:12,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin 1s linear infinite'}}/>
                    Enviando...
                  </span>
                ) : (lang==='en' ? 'Send' : 'Enviar')}
              </button>
            </div>
          )}
        </div>

        {/* ==================== PANEL KB DEL ARQUITECTO ==================== */}
        {isArq && (
          <div>
            <div className="card" style={{marginBottom:16}}>
              <div className="card-title" style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{color:'var(--gold)',display:'inline-flex',flexShrink:0}}><IconBrain /></span>
                <span>Base de conocimiento</span>
              </div>
              <p style={{fontSize:12,fontWeight:300,color:'var(--g400)',marginBottom:20,lineHeight:1.7,marginTop:4}}>
                La IA usa estos datos para responder preguntas del cliente automáticamente.
              </p>

              <div style={{marginBottom:14}}>
                <label style={{fontSize:10,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--g400)',marginBottom:6,display:'block',fontWeight:500}}>Tema</label>
                <input placeholder="Ej. Especificaciones de acero..." value={kbTema} onChange={e=>setKbTema(e.target.value)} style={inputStyle}/>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:10,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--g400)',marginBottom:6,display:'block',fontWeight:500}}>Información</label>
                <textarea placeholder="Escribe la información..." value={kbInfo} onChange={e=>setKbInfo(e.target.value)} rows={3} style={textareaStyle}/>
              </div>
              <button onClick={addKb} disabled={savingKb || !kbTema || !kbInfo}
                style={{
                  padding:'10px 22px',
                  background: savingKb || !kbTema || !kbInfo ? 'var(--g200)' : 'var(--ink)',
                  color: savingKb || !kbTema || !kbInfo ? 'var(--g400)' : 'var(--white)',
                  border:'none',
                  borderRadius: BTN_RADIUS,
                  fontFamily:'Jost,sans-serif',
                  fontSize:11,
                  fontWeight:600,
                  letterSpacing:'.1em',
                  textTransform:'uppercase',
                  cursor: savingKb || !kbTema || !kbInfo ? 'not-allowed' : 'pointer',
                }}>
                {savingKb ? 'Guardando...' : 'Agregar a base de conocimiento'}
              </button>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{color:'var(--gold)',display:'inline-flex',flexShrink:0}}><IconBook /></span>
                  <span>Entradas actuales</span>
                </div>
                <span style={{fontSize:12,color:'var(--g400)',fontWeight:300}}>{kb.length} entrada{kb.length!==1?'s':''}</span>
              </div>
              {kb.length===0 ? (
                <p style={{fontSize:13,fontWeight:300,color:'var(--g400)',marginTop:8}}>Sin datos adicionales aún.</p>
              ) : (
                <div style={{
                  maxHeight: kb.length > 5 ? 360 : 'none',
                  overflowY: kb.length > 5 ? 'auto' : 'visible',
                  paddingRight: kb.length > 5 ? 6 : 0,
                  marginTop: 4,
                }}>
                  {kb.map((k,i) => (
                    <div key={i} style={{padding:'14px 0',borderBottom: i === kb.length - 1 ? 'none' : '1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:'var(--ink)',marginBottom:4}}>{k.tema}</div>
                        <div style={{fontSize:13,fontWeight:400,color:'var(--g500)',lineHeight:1.6,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{k.info}</div>
                      </div>
                      <span className="chip chip-green" style={{flexShrink:0,borderRadius:999}}>Activo</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      </div>
    </div>
  )
}
