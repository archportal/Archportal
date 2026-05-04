import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = 'project-files'

// Extrae el path del archivo desde una signed URL antigua de Supabase
// Ej: https://xxx.supabase.co/storage/v1/object/sign/project-files/UUID/123_archivo.pdf?token=...
//     -> "UUID/123_archivo.pdf"
function extractPathFromUrl(url) {
  try {
    const u = new URL(url)
    const marker = `/storage/v1/object/sign/${BUCKET}/`
    const idx = u.pathname.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(u.pathname.substring(idx + marker.length))
  } catch {
    return null
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    let { path, url } = body

    // Si no viene el path explícito, intentar extraerlo del URL viejo
    if (!path && url) {
      path = extractPathFromUrl(url)
    }

    if (!path) {
      return Response.json({ error: 'Falta path o url válido' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .createSignedUrl(path, 3600) // 1 hora

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ signedUrl: data.signedUrl })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
