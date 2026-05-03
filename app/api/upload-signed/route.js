import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

const ALLOWED_BUCKETS = ['project-photos', 'project-files']

export async function POST(request) {
  try {
    const body = await request.json()
    const { projectId, bucket, userId, fileName, contentType } = body

    // Validaciones básicas
    if (!projectId || !bucket || !fileName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
        console.warn('[upload-signed] Ownership mismatch:', { userId, projectOwner: project.user_id })
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Sanitizar nombre y construir path
    const safeName = fileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')
    const path = `${projectId}/${Date.now()}_${safeName}`

    // Generar signed upload URL (válida 5 min)
    // El cliente subirá directamente a Supabase con esta URL
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(path)

    if (error) {
      console.error('[upload-signed] Storage error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      bucket,
    })
  } catch (error) {
    console.error('[upload-signed] Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
