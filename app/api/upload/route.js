import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Extract text from PDF buffer
async function extractPdfText(buffer) {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js')
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
    const pdf = await loadingTask.promise
    let fullText = ''
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      fullText += content.items.map(item => item.str).join(' ') + '\n'
    }
    return fullText.trim().substring(0, 3000) // limit to 3000 chars
  } catch (e) {
    console.warn('PDF extraction error:', e.message)
    return null
  }
}

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
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)

    // Extract text if PDF
    let extractedText = null
    if (file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      extractedText = await extractPdfText(buffer)
    }

    return NextResponse.json({ url: publicUrl, extractedText })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
