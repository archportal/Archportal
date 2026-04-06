// lib/ratelimit.js
// Reutilizable en cualquier API route

const ratemap = new Map()

// Limpieza cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of ratemap.entries()) {
      if (now > entry.resetAt) ratemap.delete(key)
    }
  }, 5 * 60_000)
}

/**
 * @param {string} key  - identificador único (IP, email, etc.)
 * @param {number} max  - máximo de requests permitidos
 * @param {number} windowMs - ventana de tiempo en ms
 * @returns {{ allowed: boolean, remaining: number, resetAt?: number }}
 */
export function rateLimit(key, max = 10, windowMs = 60_000) {
  const now = Date.now()
  const entry = ratemap.get(key)

  if (!entry || now > entry.resetAt) {
    ratemap.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1 }
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: max - entry.count }
}

/**
 * Devuelve la IP del request de Next.js
 */
export function getIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Respuesta 429 lista para usar
 */
export function rateLimitResponse(resetAt) {
  const waitSecs = Math.ceil((resetAt - Date.now()) / 1000)
  return Response.json(
    { error: `Demasiadas solicitudes. Intenta de nuevo en ${waitSecs} segundos.` },
    {
      status: 429,
      headers: {
        'Retry-After': String(waitSecs),
        'X-RateLimit-Remaining': '0',
      }
    }
  )
}
