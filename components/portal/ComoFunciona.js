'use client'

// =============================================================
// PARA CAMBIAR EL VIDEO EN EL FUTURO:
// 1. Sube tu video a YouTube (puede ser "no listado" si quieres
//    que solo lo vean los arquitectos con el link).
// 2. Copia el ID del video (la parte después de "v=" o después
//    de "youtu.be/" en la URL).
//    Ejemplo: https://youtu.be/ABC123xyz → ID es: ABC123xyz
// 3. Reemplaza la línea `const YOUTUBE_VIDEO_ID` con tu ID.
// 4. Guarda y haz git push. Listo.
// =============================================================

const YOUTUBE_VIDEO_ID = 'os6G0svpncQ'

export default function ComoFunciona({ project, user, lang }) {
  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <p style={{ fontSize:10, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--g400)', marginBottom:8 }}>
          Guía para constructores
        </p>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:44, fontWeight:300, color:'var(--ink)', lineHeight:1.1, margin:0 }}>
          ¿Cómo<br/><em style={{ fontStyle:'italic' }}>funciona?</em>
        </h1>
        <p style={{ fontSize:14, fontWeight:300, color:'var(--g500)', lineHeight:1.7, marginTop:16, maxWidth:640 }}>
          Una guía visual para que aproveches al máximo ArchPortal en tu despacho.
        </p>
      </div>

      {/* Video o placeholder */}
      <div style={{
        position:'relative',
        width:'100%',
        paddingTop:'56.25%', /* 16:9 ratio */
        background:'var(--ink)',
        border:'1px solid var(--border)',
        overflow:'hidden',
      }}>
        {YOUTUBE_VIDEO_ID ? (
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1`}
            title="¿Cómo funciona ArchPortal?"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none'
            }}
          />
        ) : (
          <div style={{
            position:'absolute', top:0, left:0, width:'100%', height:'100%',
            display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column',
            color:'rgba(255,255,255,.7)', textAlign:'center', padding:24,
          }}>
            <div style={{ fontSize:48, marginBottom:16, opacity:.5 }}>▶</div>
            <p style={{ fontSize:11, letterSpacing:'.2em', textTransform:'uppercase', color:'rgba(255,255,255,.5)', margin:'0 0 8px' }}>
              Video en preparación
            </p>
            <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, fontWeight:300, color:'var(--white)', margin:0 }}>
              Próximamente
            </p>
            <p style={{ fontSize:13, fontWeight:300, color:'rgba(255,255,255,.5)', margin:'12px 0 0', maxWidth:420, lineHeight:1.6 }}>
              Estamos preparando la guía completa para que conozcas todas las funciones del portal.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
