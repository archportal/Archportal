// lib/uploadWithRetry.js
// Uploads robustos para condiciones de internet inestable (obra, datos móviles, etc).
// Reintenta automáticamente ante fallos de red con backoff progresivo.

/**
 * Sube un archivo a Supabase Storage usando signed upload URLs.
 * Esto bypasea los límites de body size de Vercel (4.5MB Hobby / 10MB Pro)
 * porque el archivo va directo del navegador a Supabase, sin pasar por tu API.
 *
 * Flujo:
 * 1. POST /api/upload-signed con metadata → devuelve signedUrl temporal
 * 2. PUT el archivo directo a Supabase con la signedUrl
 * 3. Devolver el path al frontend (Admin.js lo guarda en DB)
 *
 * @param {File|Blob} file - Archivo a subir
 * @param {object} fields - { projectId, bucket, userId }
 * @param {object} options - { onProgress, onRetry, timeoutMs, maxRetries }
 * @returns {Promise<{url: string, path: string} | null>}
 */
export async function uploadToApiWithRetry(file, fields = {}, options = {}) {
  const {
    onProgress = null,
    onRetry = null,
    timeoutMs = 120000, // 2 min para fotos grandes en conexión móvil lenta
    maxRetries = 3,
    retryDelays = [2000, 5000],
  } = options

  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // PASO 1: Pedir signed upload URL al backend
      onProgress?.(5)

      const prepareRes = await fetch('/api/upload-signed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: fields.projectId,
          bucket: fields.bucket,
          userId: fields.userId,
          fileName: file.name || `upload_${Date.now()}`,
          contentType: file.type || 'application/octet-stream',
        }),
      })

      if (!prepareRes.ok) {
        const errData = await prepareRes.json().catch(() => ({}))
        throw new Error(errData.error || `Server error: ${prepareRes.status}`)
      }

      const { signedUrl, path } = await prepareRes.json()
      onProgress?.(10)

      // PASO 2: Subir directo a Supabase con XMLHttpRequest (con progress real)
      const uploadResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Progreso real desde el cliente al storage
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            // 10% por la prepare, 85% durante upload, 5% para finalizar
            const pct = 10 + Math.round((e.loaded / e.total) * 85)
            onProgress?.(pct)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress?.(100)
            resolve({ url: path, path })
          } else {
            reject(new Error(`Storage upload error: ${xhr.status} ${xhr.statusText}`))
          }
        }

        xhr.onerror = () => reject(new Error('Error de red al subir a storage'))
        xhr.ontimeout = () => reject(new Error('TIMEOUT subiendo a storage'))
        xhr.onabort = () => reject(new Error('Upload cancelado'))

        xhr.timeout = timeoutMs
        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.send(file)
      })

      return uploadResult

    } catch (err) {
      lastError = err
      console.warn(`Upload intento ${attempt}/${maxRetries} falló:`, err.message)

      if (attempt < maxRetries) {
        const delay = retryDelays[attempt - 1] || 5000
        onRetry?.(attempt, maxRetries)
        onProgress?.(5)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.error('Upload falló después de', maxRetries, 'intentos:', lastError?.message)
  throw lastError || new Error('Upload falló')
}

/**
 * (DEPRECATED, mantenido por compatibilidad)
 * Sube un archivo a Supabase Storage con reintentos automáticos.
 * Esta función ya NO se usa — el flujo nuevo usa signed upload URLs.
 */
export async function uploadToSupabaseWithRetry(supabase, file, bucket, path, options = {}) {
  const {
    contentType = file.type,
    upsert = true,
    onProgress = null,
    onRetry = null,
    timeoutMs = 60000,
    maxRetries = 3,
    retryDelays = [2000, 5000],
  } = options

  const arrayBuffer = await file.arrayBuffer()
  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      onProgress?.(50)

      let simulated = 50
      const progressInterval = setInterval(() => {
        if (simulated < 85) { simulated += 2; onProgress?.(simulated) }
      }, 400)

      const uploadPromise = supabase.storage
        .from(bucket)
        .upload(path, arrayBuffer, { contentType, upsert })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
      )

      const { error } = await Promise.race([uploadPromise, timeoutPromise])
      clearInterval(progressInterval)

      if (error) throw error

      onProgress?.(95)
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
      onProgress?.(100)
      return { url: publicUrl }

    } catch (err) {
      lastError = err
      console.warn(`Upload intento ${attempt}/${maxRetries} falló:`, err.message || err)

      if (attempt < maxRetries) {
        const delay = retryDelays[attempt - 1] || 5000
        onRetry?.(attempt, maxRetries)
        onProgress?.(40)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.error('Upload falló después de', maxRetries, 'intentos:', lastError?.message)
  onProgress?.(0)
  return null
}
