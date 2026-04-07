'use client'
import { useState } from 'react'
import { sendNotifEmail, sendBitacoraEmail } from '@/lib/emailjs'

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
    return `Eres el asistente del proyecto "${p.nombre}" ubicado en ${p.ubicacion}. El arquitecto es ${p.arquitecto}. Avance general: ${avg}%. Etapa actual: ${p.etapa_actual}. Presupuesto aprobado: $${(p.presupuesto||0).toLocaleString('es-MX')} MXN. Monto ejercido: $${(p.pres_ejercido||0).toLocaleString('es-MX')} MXN.${kbText?'\n\nInformación adicional del proyecto:\n'+kbText:''}\n\nResponde SOLO con información del proyecto. Si no tienes el dato exacto, indica que el arquitecto responderá personalmente. Sé conciso y claro.`
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

  return (
    <div>
      <div className="section-hero" style={{marginBottom:20}}>
        <div className="section-hero-eyebrow">Proyecto · Asistencia</div>
        <h1 className="section-hero-title">Soporte</h1>
        <p className="section-hero-sub">{isArq ? 'Gestiona preguntas del cliente y base de conocimiento' : (lang==='en'?'Send your questions about the project':'Envía tus preguntas sobre el proyecto')}</p>
      </div>

      <div className={isArq ? 'two-col' : ''}>

        {/* Preguntas */}
        <div className="card">
          <div className="card-title">{isArq?'Preguntas del cliente':(lang==='en'?'My questions':'Mis preguntas')}</div>

          {questions.length===0 && (
            <div style={{padding:'32px 0',textAlign:'center'}}>
              <div style={{fontSize:40,marginBottom:12}}>💬</div>
              <p style={{fontSize:13,fontWeight:300,color:'var(--g400)'}}>{isArq?'El cliente aún no ha enviado preguntas.':'Sin preguntas aún.'}</p>
            </div>
          )}

          {questions.map((q,i) => (
            <div key={i} style={{padding:'20px 0',borderBottom:'1px solid var(--g100)'}}>
              {/* Question */}
              <div style={{display:'flex',gap:12,marginBottom:12}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:'var(--white)',flexShrink:0}}>{isArq?'CL':'TU'}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={{fontSize:12,fontWeight:500,color:'var(--ink)'}}>{isArq?'Cliente':(lang==='en'?'Your question':'Tu pregunta')}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:10,color:'var(--g400)'}}>{new Date(q.created_at||Date.now()).toLocaleString('es-MX')}</span>
                      {isArq && <button onClick={()=>deleteQuestion(i)} style={{fontSize:10,color:'var(--danger)',background:'transparent',border:'1px solid var(--danger)',padding:'2px 8px',cursor:'pointer',fontFamily:'Jost,sans-serif',flexShrink:0}}>✕</button>}
                    </div>
                  </div>
                  <p style={{fontSize:14,fontWeight:300,color:'var(--g600)',lineHeight:1.7,margin:0}}>{q.pregunta}</p>
                </div>
              </div>

              {/* Answer */}
              {q.respuesta && editingResp[i]===undefined ? (
                <div style={{marginLeft:48,background:q.ia_respondio?'#F8F4EE':'var(--paper)',padding:'14px 18px',borderLeft:`3px solid ${q.ia_respondio?'var(--gold)':'var(--ink)'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:9,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--g400)',fontWeight:500}}>{q.ia_respondio?'✨ Asistente IA':(lang==='en'?'Architect':'Arquitecto')}</span>
                    </div>
                    {isArq && (
                      <button onClick={()=>setEditingResp(prev=>({...prev,[i]:q.respuesta}))} style={{fontSize:10,background:'transparent',border:'1px solid var(--border)',padding:'3px 12px',cursor:'pointer',fontFamily:'Jost,sans-serif',letterSpacing:'.06em',textTransform:'uppercase',color:'var(--g500)'}}>
                        Editar
                      </button>
                    )}
                  </div>
                  <p style={{fontSize:13,fontWeight:300,color:'var(--ink)',lineHeight:1.75,margin:0}}>{cleanText(q.respuesta)}</p>
                </div>
              ) : isArq ? (
                <div style={{marginLeft:48}}>
                  <textarea value={editingResp[i]!==undefined?editingResp[i]:''} onChange={e=>setEditingResp(prev=>({...prev,[i]:e.target.value}))} placeholder="Escribe tu respuesta..." rows={3}
                    style={{width:'100%',padding:'10px 0',border:'none',borderBottom:'1.5px solid var(--border)',fontFamily:'Jost,sans-serif',fontSize:13,background:'transparent',outline:'none',resize:'none',color:'var(--ink)'}}/>
                  <div style={{display:'flex',gap:8,marginTop:10}}>
                    <button onClick={()=>responder(i, editingResp[i]||'')} style={{padding:'9px 22px',background:'var(--ink)',color:'var(--white)',border:'none',fontFamily:'Jost,sans-serif',fontSize:11,fontWeight:500,letterSpacing:'.08em',textTransform:'uppercase',cursor:'pointer'}}>
                      {q.respuesta?'Actualizar y notificar':'Responder y notificar'}
                    </button>
                    {q.respuesta && <button onClick={()=>setEditingResp(prev=>{const n={...prev};delete n[i];return n})} style={{padding:'9px 16px',background:'transparent',border:'1px solid var(--border)',fontFamily:'Jost,sans-serif',fontSize:11,color:'var(--g500)',cursor:'pointer'}}>Cancelar</button>}
                  </div>
                </div>
              ) : (
                <div style={{marginLeft:48,background:'var(--paper)',padding:'14px 18px',borderLeft:'3px solid var(--g200)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,color:'var(--white)',flexShrink:0}}>
                      {(p.arquitecto||'A').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}
                    </div>
                    <span style={{fontSize:11,fontWeight:500,color:'var(--ink)'}}>{p.arquitecto || 'Tu arquitecto'}</span>
                    <span style={{fontSize:10,padding:'2px 8px',background:'var(--warn-bg)',color:'var(--warn)',letterSpacing:'.06em',textTransform:'uppercase'}}>Pendiente</span>
                  </div>
                  <p style={{fontSize:13,fontWeight:300,color:'var(--g600)',lineHeight:1.7,margin:0}}>
                    {lang==='en'
                      ? `${p.arquitecto||'Your architect'} has been notified and will respond to you personally as soon as possible.`
                      : `${p.arquitecto||'Tu arquitecto'} fue notificado y te responderá personalmente a la brevedad.`}
                  </p>
                </div>
              )}
            </div>
          ))}

          {!isArq && (
            <div style={{marginTop:20}}>
              <div className="form-field">
                <label className="form-label">{lang==='en'?'New question':'Nueva pregunta'}</label>
                <textarea className="form-input" placeholder={lang==='en'?'Write your question...':'Escribe tu pregunta sobre el proyecto...'} value={pregunta} onChange={e=>setPregunta(e.target.value)} rows={3} style={{resize:'vertical',borderBottom:'1.5px solid var(--border)',width:'100%',padding:'8px 0'}}/>
              </div>
              <button className="btn-submit" onClick={enviar} disabled={loading||!pregunta.trim()} style={{marginTop:8,maxWidth:200}}>
                {loading ? (
                  <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                    <span style={{width:12,height:12,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin 1s linear infinite'}}/>
                    Enviando...
                  </span>
                ) : (lang==='en'?'Send':'Enviar')}
              </button>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
        </div>

        {/* Architect KB panel */}
        {isArq && (
          <div>
            <div className="card" style={{marginBottom:16}}>
              <div className="card-title">Base de conocimiento</div>
              <p style={{fontSize:12,fontWeight:300,color:'var(--g400)',marginBottom:20,lineHeight:1.7}}>La IA usa estos datos para responder preguntas del cliente automáticamente.</p>
              <div className="form-field"><label className="form-label">Tema</label><input className="form-input" placeholder="Ej. Especificaciones de acero..." value={kbTema} onChange={e=>setKbTema(e.target.value)}/></div>
              <div className="form-field"><label className="form-label">Información</label><textarea className="form-input" placeholder="Escribe la información..." value={kbInfo} onChange={e=>setKbInfo(e.target.value)} rows={3} style={{resize:'vertical',borderBottom:'1.5px solid var(--border)',width:'100%',padding:'8px 0'}}/></div>
              <button className="btn-submit" style={{maxWidth:260}} onClick={addKb} disabled={savingKb}>{savingKb?'Guardando...':'Agregar a base de conocimiento'}</button>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Entradas actuales</div>
                <span style={{fontSize:12,color:'var(--g400)'}}>{kb.length} entrada{kb.length!==1?'s':''}</span>
              </div>
              {kb.length===0 ? (
                <p style={{fontSize:13,fontWeight:300,color:'var(--g400)'}}>Sin datos adicionales aún.</p>
              ) : (
                <div style={{overflowY:'scroll',maxHeight:300}}>
                  {kb.map((k,i) => (
                    <div key={i} style={{padding:'12px 0',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:'var(--ink)',marginBottom:3}}>{k.tema}</div>
                        <div style={{fontSize:12,fontWeight:300,color:'var(--g500)',lineHeight:1.6}}>{k.info}</div>
                      </div>
                      <span className="chip chip-green" style={{flexShrink:0}}>Activo</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
