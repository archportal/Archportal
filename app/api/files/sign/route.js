import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = 'project-files'

// Extrae el path del archivo desde una signed URL antigua de Supabase
// Ej: https://xxx.supabase.co/storage/v1/object/sign/project-files/UUID/123_archivo.pdf?token=...
//     -> "UUID/123_archivo.pdf"
function extractPathFromSignedUrl(url) {
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

// Resuelve un path de Storage desde varias entradas posibles:
// 1. Si viene `path` explícito → úsalo
// 2. Si viene `url` que parece signed URL → extraer path
// 3. Si viene `url` que parece ser un path (no http) → úsalo directamente
function resolvePath({ path, url }) {
  if (path && typeof path === 'string') return path

  if (url && typeof url === 'string') {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return extractPathFromSignedUrl(url)
    }
    // Es un path directo (caso: archivos recién subidos antes del refetch)
    return url
  }

  return null
}

export async function POST(req) {
  try {
    const body = await req.json()
    const path = resolvePath(body)

    if (!path) {
      return Response.json({ error: 'Falta path o url válido' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .createSignedUrl(path, 3600) // 1 hora

    if (error) {
      console.error('[files/sign] Storage error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ signedUrl: data.signedUrl })
  } catch (err) {
    console.error('[files/sign] Unexpected error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
