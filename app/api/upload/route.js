import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const projectId = formData.get('projectId')
    const bucket = formData.get('bucket') || 'project-photos'

    if (!file || !projectId) {
      return NextResponse.json({ error: 'Missing file or projectId' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = file.name.replace(/\s/g, '_')
    const path = `${projectId}/${Date.now()}_${fileName}`

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path)

    return NextResponse.json({ url: publicUrl })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
