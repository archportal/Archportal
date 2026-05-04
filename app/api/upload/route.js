import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const maxDuration = 60

const ALLOWED_BUCKETS = ['project-photos', 'project-files']

// Sanitiza nombre de archivo preservando información (acentos → letra base, ñ → n, etc.)
function sanitizeFileName(name) {
  if (!name) return `upload_${Date.now()}`
  return name
    .normalize('NFD')                          // descompone acentos: á → a + ́
    .replace(/[\u0300-\u036f]/g, '')          // remueve marcas de acento combinantes
    .replace(/\s+/g, '_')                     // espacios → underscore
    .replace(/[^a-zA-Z0-9._-]/g, '')          // elimina cualquier otro carácter raro
    .replace(/_+/g, '_')                      // colapsa underscores múltiples
    .replace(/^[._-]+|[._-]+$/g, '')          // sin puntos/guiones al inicio/final
    || `upload_${Date.now()}`                  // fallback si quedó vacío
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const projectId = formData.get('projectId')
    const bucket = formData.get('bucket') || 'project-photos'
    const userId = formData.get('userId')

    // Validaciones básicas
    if (!file || !projectId) {
      return NextResponse.json({ error: 'Missing file or projectId' }, { status: 400 })
    }
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }

    // Validación de ownership: el proyecto debe pertenecer al user
    if (userId) {
      const { data: project, error: projError } = await supabaseAdmin
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .maybeSingle()

      if (projError || !project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      if (project.user_id !== userId) {
        console.warn('[upload] Ownership mismatch:', { userId, projectOwner: project.user_id, projectId })
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = sanitizeFileName(file.name)
    const path = `${projectId}/${Date.now()}_${fileName}`

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (error) {
      console.error('[upload] Storage error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ⚠️ IMPORTANTE: devolvemos `path` en el campo `url` (no publicUrl).
    // El bucket es privado — las URLs públicas no funcionan.
    // El backend GET de /api/projects firmará este path al vuelo con signed URLs.
    return NextResponse.json({ url: path, path, bucket, extractedText: null })

  } catch (error) {
    console.error('[upload] Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
