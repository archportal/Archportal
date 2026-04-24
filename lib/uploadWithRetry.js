// lib/uploadWithRetry.js
// Uploads robustos para condiciones de internet inestable (obra, datos móviles, etc).
// Reintenta automáticamente ante fallos de red con backoff progresivo.

/**
 * Sube un archivo a Supabase Storage con reintentos automáticos y timeout.
 * @param {object} supabase - Cliente de Supabase
 * @param {File|Blob} file - Archivo a subir (ya procesado/comprimido)
 * @param {string} bucket - Nombre del bucket (ej. 'project-photos', 'project-files')
 * @param {string} path - Ruta dentro del bucket (ej. 'projectId/filename.jpg')
 * @param {object} options - { contentType, upsert, onProgress, onRetry, timeoutMs, maxRetries }
 * @returns {Promise<{url: string} | null>}
 */
export async function uploadToSupabaseWithRetry(supabase, file, bucket, path, options = {}) {
  const {
    contentType = file.type,
    upsert = true,
    onProgress = null,       // (pct) => void  [50..95 mientras sube]
    onRetry = null,          // (attempt, maxRetries) => void  [notifica al UI]
    timeoutMs = 60000,       // 60 segundos por intento
    maxRetries = 3,          // 3 intentos totales (1 original + 2 reintentos)
    retryDelays = [2000, 5000], // 2s y 5s de espera entre reintentos
  } = options

  const arrayBuffer = await file.arrayBuffer()
  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      onProgress?.(50)

      // Progreso simulado mientras sube (Supabase no da progreso real)
      let simulated = 50
      const progressInterval = setInterval(() => {
        if (simulated < 85) { simulated += 2; onProgress?.(simulated) }
      }, 400)

      // Timeout manual — si tarda más de timeoutMs, abortamos
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

      // Si no es el último intento, espera y reintenta
      if (attempt < maxRetries) {
        const delay = retryDelays[attempt - 1] || 5000
        onRetry?.(attempt, maxRetries)
        onProgress?.(40) // retrocede la barra para que el usuario vea que está reintentando
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Todos los intentos fallaron
  console.error('Upload falló después de', maxRetries, 'intentos:', lastError?.message)
  onProgress?.(0)
  return null
}

/**
 * Sube un archivo al endpoint /api/upload con reintentos y timeout.
 * Usa XHR para tener progreso real del upload.
 * @param {File|Blob} file - Archivo a subir
 * @param {object} fields - Campos adicionales del FormData ({ projectId, bucket })
 * @param {object} options - { onProgress, onRetry, timeoutMs, maxRetries }
 * @returns {Promise<{url: string} | null>}
 */
export async function uploadToApiWithRetry(file, fields = {}, options = {}) {
  const {
    onProgress = null,
    onRetry = null,
    timeoutMs = 60000,
    maxRetries = 3,
    retryDelays = [2000, 5000],
    endpoint = '/api/upload',
  } = options

  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const fd = new FormData()
        fd.append('file', file, file.name || `upload_${Date.now()}`)
        Object.entries(fields).forEach(([k, v]) => fd.append(k, v))

        // Progreso real del upload
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 90) // hasta 90% (10% restante para procesamiento)
            onProgress?.(pct)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              onProgress?.(100)
              resolve(data)
            } catch {
              reject(new Error('Respuesta inválida del servidor'))
            }
          } else {
            reject(new Error(`Error del servidor: ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Error de red'))
        xhr.ontimeout = () => reject(new Error('TIMEOUT'))
        xhr.onabort = () => reject(new Error('Upload cancelado'))

        xhr.timeout = timeoutMs
        xhr.open('POST', endpoint)
        xhr.send(fd)
      })

      return result

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
