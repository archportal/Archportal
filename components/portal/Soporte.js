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
  const [editingResp, setEditingResp] = useState({}) // {index: text}
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
      const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ pregunta:q, projectId:p.id, context:buildContext(), apiKey }) })
      const data = await res.json()
      setQuestions(prev => prev.map((item,i) => i===0 ? { ...item, respuesta:data.respuesta||null, ia_respondio:data.iaRespondio } : item))
      if (!data.iaRespondio) {
        sendNotifEmail({
          arquitectoEmail:  p.architect_email || p.architectemail,
          arquitectoNombre: p.arquitecto,
          clienteNombre:    p.cliente || user.email,
          clienteEmail:     user.email,
          proyecto:         p.nombre,
          pregunta:         q
        })
      }
      const updatedQs = [{ pregunta:q, respuesta:data.respuesta||null, ia_respondio:data.iaRespondio||false }, ...qInit]
      await fetch('/api/projects', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:p.id, questions:updatedQs }) })
    } catch(e) { console.warn('AI error:',e) }
    finally { setLoading(false) }
  }

  // Architect responds or overrides IA response
  const responder = async (i, texto) => {
    if (!texto.trim()) return
    const updated = [...questions]
    updated[i] = { ...updated[i], respuesta:texto, ia_respondio:false }
    setQuestions(updated)
    setEditingResp(prev => { const n={...prev}; delete n[i]; return n })
    await fetch('/api/projects', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:p.id, questions:updated }) })
    // Notify client by email
    sendBitacoraEmail({
      clientEmail:      p.client_email,
      arquitectoNombre: user.name || user.email,
      arquitectoEmail:  user.email,
      proyecto:         p.nombre,
      cliente:          p.cliente,
      nota:             `Tu arquitecto respondió tu pregunta: "${updated[i].pregunta}"\n\nRespuesta: ${texto}`
    })
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

  return (
    <div>
      <div style={{paddingBottom:24,borderBottom:'1px solid var(--border)',marginBottom:24}}>
        <h1 style={{fontFamily:'Cormorant Garamond, serif',fontSize:36,fontWeight:300,color:'var(--ink)',marginBottom:4}}>Soporte</h1>
        <p style={{fontSize:13,fontWeight:300,color:'var(--g400)'}}>{isArq ? 'Gestiona preguntas del cliente y base de conocimiento' : (lang==='en'?'Send your questions about the project':'Envía tus preguntas sobre el proyecto')}</p>
      </div>

      <div className={isArq ? 'two-col' : ''}>
        {/* LEFT: Questions */}
        <div className="card">
          <div className="card-title">{isArq?'Preguntas del cliente':(lang==='en'?'My questions':'Mis preguntas')}</div>

          {questions.length===0 && <p style={{fontSize:13,fontWeight:300,color:'var(--g400)',marginBottom:20}}>{isArq?'El cliente aún no ha enviado preguntas.':'Sin preguntas aún.'}</p>}

          {questions.map((q,i) => (
            <div key={i} style={{marginBottom:20,paddingBottom:20,borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',gap:10,marginBottom:8}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'var(--g100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'var(--g600)',flexShrink:0}}>{isArq?'CL':'TU'}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:400,color:'var(--ink)',marginBottom:2}}>{isArq?'Cliente':(lang==='en'?'Your question':'Tu pregunta')}</div>
                  <div style={{fontSize:11,color:'var(--g400)'}}>{new Date(q.created_at||Date.now()).toLocaleString('es-MX')}</div>
                </div>
              </div>
              <p style={{fontSize:13,fontWeight:300,color:'var(--ink)',marginLeft:42,marginBottom:10}}>{q.pregunta}</p>

              {/* Response area */}
              {q.respuesta && !editingResp[i] ? (
                <div style={{marginLeft:42,background:'var(--paper)',padding:'12px 16px',borderLeft:'2px solid var(--ink)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <div style={{fontSize:10,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--g400)'}}>{q.ia_respondio?'IA':(lang==='en'?'Architect':'Arquitecto')}</div>
                    {isArq && (
                      <button onClick={()=>setEditingResp(prev=>({...prev,[i]:q.respuesta}))} style={{fontSize:10,background:'transparent',border:'1px solid var(--border)',padding:'2px 10px',cursor:'pointer',fontFamily:'Jost,sans-serif',letterSpacing:'.06em',textTransform:'uppercase',color:'var(--g500)'}}>
                        Editar
                      </button>
                    )}
                  </div>
                  <p style={{fontSize:13,fontWeight:300,color:'var(--ink)',lineHeight:1.7,margin:0}}>{q.respuesta.replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1').replace(/`(.*?)`/g,'$1')}</p>
                </div>
              ) : isArq ? (
                <div style={{marginLeft:42}}>
                  <textarea
                    value={editingResp[i] !== undefined ? editingResp[i] : ''}
                    onChange={e=>setEditingResp(prev=>({...prev,[i]:e.target.value}))}
                    placeholder="Escribe tu respuesta..."
                    rows={3}
                    style={{width:'100%',padding:'8px 0',border:'none',borderBottom:'1px solid var(--border)',fontFamily:'Jost,sans-serif',fontSize:13,background:'transparent',outline:'none',resize:'none'}}
                  />
                  <div style={{display:'flex',gap:8,marginTop:8}}>
                    <button onClick={()=>responder(i, editingResp[i]||'')} style={{padding:'8px 20px',background:'var(--ink)',color:'var(--white)',border:'none',fontFamily:'Jost,sans-serif',fontSize:11,fontWeight:500,letterSpacing:'.08em',textTransform:'uppercase',cursor:'pointer'}}>
                      {editingResp[i]!==undefined && q.respuesta ? 'Actualizar y notificar' : 'Responder y notificar'}
                    </button>
                    {q.respuesta && <button onClick={()=>setEditingResp(prev=>{ const n={...prev}; delete n[i]; return n })} style={{padding:'8px 16px',background:'transparent',border:'1px solid var(--border)',fontFamily:'Jost,sans-serif',fontSize:11,color:'var(--g500)',cursor:'pointer'}}>Cancelar</button>}
                  </div>
                </div>
              ) : (
                <p style={{marginLeft:42,fontSize:12,fontWeight:300,color:'var(--g400)',fontStyle:'italic'}}>{lang==='en'?'The architect received your question and will respond soon.':'El arquitecto recibió tu pregunta y te responderá pronto.'}</p>
              )}
            </div>
          ))}

          {!isArq && (
            <div style={{marginTop:8}}>
              <div className="form-field">
                <label className="form-label">{lang==='en'?'New question':'Nueva pregunta'}</label>
                <textarea className="form-input" placeholder={lang==='en'?'Write your question...':'Escribe tu pregunta sobre el proyecto...'} value={pregunta} onChange={e=>setPregunta(e.target.value)} rows={3} style={{resize:'vertical',borderBottom:'1.5px solid var(--border)',width:'100%',padding:'8px 0'}}/>
              </div>
              <button className="btn-submit" onClick={enviar} disabled={loading||!pregunta.trim()} style={{marginTop:8}}>
                {loading?'...':(lang==='en'?'Send':'Enviar')}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: KB — solo visible para arquitecto */}
        {isArq && (
          <div>
            <div className="card" style={{marginBottom:16}}>
              <div className="card-title">Agregar dato a base de conocimiento</div>
              <p style={{fontSize:12,fontWeight:300,color:'var(--g400)',marginBottom:16,lineHeight:1.7}}>La IA usará estos datos para responder preguntas del cliente automáticamente.</p>
              <div className="form-field"><label className="form-label">Tema</label><input className="form-input" placeholder="Ej. Especificaciones de acero, Fecha de colado..." value={kbTema} onChange={e=>setKbTema(e.target.value)}/></div>
              <div className="form-field"><label className="form-label">Información detallada</label><textarea className="form-input" placeholder="Escribe la información que la IA deberá conocer..." value={kbInfo} onChange={e=>setKbInfo(e.target.value)} rows={3} style={{resize:'vertical',borderBottom:'1.5px solid var(--border)',width:'100%',padding:'8px 0'}}/></div>
              <button className="btn-submit" style={{maxWidth:260}} onClick={addKb} disabled={savingKb}>{savingKb?'...':'Agregar a base de conocimiento'}</button>
            </div>

            <div className="card">
              <div className="card-title">Base de conocimiento actual</div>
              {kb.length===0 ? (
                <p style={{fontSize:13,fontWeight:300,color:'var(--g400)'}}>Sin datos adicionales aún.</p>
              ) : kb.map((k,i) => (
                <div key={i} style={{padding:'10px 0',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div><div style={{fontSize:12,fontWeight:500,color:'var(--ink)',marginBottom:2}}>{k.tema}</div><div style={{fontSize:12,fontWeight:300,color:'var(--g500)'}}>{k.info}</div></div>
                  <span style={{fontSize:10,padding:'2px 8px',background:'var(--g100)',color:'var(--g500)',marginLeft:8,flexShrink:0}}>DISPONIBLE</span>
                </div>
              ))}
              <p style={{fontSize:12,fontWeight:300,color:'var(--g400)',marginTop:16,lineHeight:1.7}}>El asistente responde automáticamente con la información cargada. Si no tiene el dato, el arquitecto recibe una notificación y responde personalmente.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Soporte({ project, user, lang, onRefresh, isArq }) {
  const p = project?.project || project || {}
  const qInit = project?.questions || []
  const [questions, setQuestions] = useState(qInit)
  const [pregunta, setPregunta] = useState('')
  const [loading, setLoading] = useState(false)
  const [kbTema, setKbTema] = useState('')
  const [kbInfo, setKbInfo] = useState('')
  const [savingKb, setSavingKb] = useState(false)
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
      const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ pregunta:q, projectId:p.id, context:buildContext(), apiKey }) })
      const data = await res.json()
      setQuestions(prev => prev.map((item,i) => i===0 ? { ...item, respuesta:data.respuesta||null, ia_respondio:data.iaRespondio } : item))
      if (!data.iaRespondio) {
        sendNotifEmail({
          arquitectoEmail:  p.architect_email || p.architectemail,
          arquitectoNombre: p.arquitecto,
          clienteNombre:    p.cliente || user.email,
          clienteEmail:     user.email,
          proyecto:         p.nombre,
          pregunta:         q
        })
      }
      // Save question to DB
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

  return (
    <div>
      <div style={{paddingBottom:24,borderBottom:'1px solid var(--border)',marginBottom:24}}>
        <h1 style={{fontFamily:'Cormorant Garamond, serif',fontSize:36,fontWeight:300,color:'var(--ink)',marginBottom:4}}>Soporte</h1>
        <p style={{fontSize:13,fontWeight:300,color:'var(--g400)'}}>{isArq ? 'Gestiona preguntas del cliente y base de conocimiento' : (lang==='en'?'Send your questions about the project':'Envía tus preguntas sobre el proyecto')}</p>
      </div>

      <div className="two-col">
        {/* LEFT: Questions */}
        <div className="card">
          <div className="card-title">{isArq?'Preguntas del cliente':(lang==='en'?'My questions':'Mis preguntas')}</div>

          {questions.length===0 && <p style={{fontSize:13,fontWeight:300,color:'var(--g400)',marginBottom:20}}>{isArq?'El cliente aún no ha enviado preguntas.':'Sin preguntas aún.'}</p>}

          {questions.map((q,i) => (
            <div key={i} style={{marginBottom:20,paddingBottom:20,borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',gap:10,marginBottom:8}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'var(--g100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'var(--g600)',flexShrink:0}}>{isArq?'CL':'TU'}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:400,color:'var(--ink)',marginBottom:2}}>{isArq?'Cliente':(lang==='en'?'Your question':'Tu pregunta')}</div>
                  <div style={{fontSize:11,color:'var(--g400)'}}>{new Date(q.created_at||Date.now()).toLocaleString('es-MX')}</div>
                </div>
              </div>
              <p style={{fontSize:13,fontWeight:300,color:'var(--ink)',marginLeft:42,marginBottom:10}}>{q.pregunta}</p>

              {q.respuesta ? (
                <div style={{marginLeft:42,background:'var(--paper)',padding:'12px 16px',borderLeft:'2px solid var(--ink)'}}>
                  <div style={{fontSize:10,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--g400)',marginBottom:6}}>{q.ia_respondio?'IA':(lang==='en'?'Architect':'Arquitecto')}</div>
                  <p style={{fontSize:13,fontWeight:300,color:'var(--ink)',lineHeight:1.7,margin:0}}>{q.respuesta.replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1').replace(/`(.*?)`/g,'$1')}</p>
                </div>
              ) : isArq ? (
                <div style={{marginLeft:42}}>
                  <textarea id={`resp-${i}`} placeholder="Escribe tu respuesta..." rows={2} style={{width:'100%',padding:'8px 0',border:'none',borderBottom:'1px solid var(--border)',fontFamily:'Jost,sans-serif',fontSize:13,background:'transparent',outline:'none',resize:'none'}}/>
                  <button onClick={()=>responder(i,document.getElementById(`resp-${i}`).value)} style={{marginTop:8,padding:'8px 20px',background:'var(--ink)',color:'var(--white)',border:'none',fontFamily:'Jost,sans-serif',fontSize:11,fontWeight:500,letterSpacing:'.08em',textTransform:'uppercase',cursor:'pointer'}}>Responder</button>
                </div>
              ) : (
                <p style={{marginLeft:42,fontSize:12,fontWeight:300,color:'var(--g400)',fontStyle:'italic'}}>{lang==='en'?'The architect received your question and will respond soon.':'El arquitecto recibió tu pregunta y te responderá pronto.'}</p>
              )}
            </div>
          ))}

          {!isArq && (
            <div style={{marginTop:8}}>
              <div className="form-field">
                <label className="form-label">{lang==='en'?'New question':'Nueva pregunta'}</label>
                <textarea className="form-input" placeholder={lang==='en'?'Write your question...':'Escribe tu pregunta sobre el proyecto...'} value={pregunta} onChange={e=>setPregunta(e.target.value)} rows={3} style={{resize:'vertical',borderBottom:'1.5px solid var(--border)',width:'100%',padding:'8px 0'}}/>
              </div>
              <button className="btn-submit" onClick={enviar} disabled={loading||!pregunta.trim()} style={{marginTop:8}}>
                {loading?'...':(lang==='en'?'Send':'Enviar')}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: KB */}
        <div>
          {isArq && (
            <div className="card" style={{marginBottom:16}}>
              <div className="card-title">Agregar dato a base de conocimiento</div>
              <p style={{fontSize:12,fontWeight:300,color:'var(--g400)',marginBottom:16,lineHeight:1.7}}>La IA usará estos datos para responder preguntas del cliente automáticamente.</p>
              <div className="form-field"><label className="form-label">Tema</label><input className="form-input" placeholder="Ej. Especificaciones de acero, Fecha de colado..." value={kbTema} onChange={e=>setKbTema(e.target.value)}/></div>
              <div className="form-field"><label className="form-label">Información detallada</label><textarea className="form-input" placeholder="Escribe la información que la IA deberá conocer..." value={kbInfo} onChange={e=>setKbInfo(e.target.value)} rows={3} style={{resize:'vertical',borderBottom:'1.5px solid var(--border)',width:'100%',padding:'8px 0'}}/></div>
              <button className="btn-submit" style={{maxWidth:260}} onClick={addKb} disabled={savingKb}>{savingKb?'...':'Agregar a base de conocimiento'}</button>
            </div>
          )}

          <div className="card">
            <div className="card-title">Base de conocimiento {isArq?'actual':'disponible'}</div>
            {kb.length===0 ? (
              <p style={{fontSize:13,fontWeight:300,color:'var(--g400)'}}>Sin datos adicionales aún.</p>
            ) : kb.map((k,i) => (
              <div key={i} style={{padding:'10px 0',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div><div style={{fontSize:12,fontWeight:500,color:'var(--ink)',marginBottom:2}}>{k.tema}</div><div style={{fontSize:12,fontWeight:300,color:'var(--g500)'}}>{k.info}</div></div>
                <span style={{fontSize:10,padding:'2px 8px',background:'var(--g100)',color:'var(--g500)',marginLeft:8,flexShrink:0}}>DISPONIBLE</span>
              </div>
            ))}
            <p style={{fontSize:12,fontWeight:300,color:'var(--g400)',marginTop:16,lineHeight:1.7}}>El asistente responde automáticamente con la información cargada. Si no tiene el dato, el arquitecto recibe una notificación y responde personalmente.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
