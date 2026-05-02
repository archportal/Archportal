import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/ratelimit'
import { getStripePriceEnvKey, PLAN_KEY_MAP } from '@/lib/plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function getPromotionCodeId(code) {
  try {
    const promoCodes = await stripe.promotionCodes.list({ code, active: true, limit: 1 })
    return promoCodes.data[0]?.id || null
  } catch {
    return null
  }
}

export async function POST(request) {
  try {
    // Rate limit: 5 sesiones de checkout por minuto por IP
    const rl = rateLimit(getIP(request), 5, 60_000)
    if (!rl.allowed) return rateLimitResponse(rl.resetAt)

    const { plan, nombre, email, password, despacho, ciudad, tel, coupon } = await request.json()

    // Validar plan
    const canonicalPlan = PLAN_KEY_MAP[plan]
    if (!canonicalPlan) {
      return NextResponse.json({ error: 'Plan no válido' }, { status: 400 })
    }
    const priceId = process.env[getStripePriceEnvKey(plan)]
    if (!priceId) {
      console.error('Missing Stripe price ID for plan:', plan)
      return NextResponse.json({ error: 'Configuración de plan incompleta' }, { status: 500 })
    }

    // Validar inputs
    if (!email || !password || !nombre) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }
    if (password.length < 10) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 10 caracteres' }, { status: 400 })
    }

    // Validar cupón ANTES de crear la sesión — si pasaron uno y no existe, error explícito
    let promotionCodeId = null
    if (coupon) {
      promotionCodeId = await getPromotionCodeId(coupon)
      if (!promotionCodeId) {
        return NextResponse.json({ error: 'Cupón inválido o expirado' }, { status: 400 })
      }
    }

    // ──────────────────────────────────────────────────────────────────
    // SEGURIDAD: nunca metas el password en Stripe metadata.
    // Hash el password con bcrypt y guarda los datos del registro en una
    // tabla temporal `pending_registrations`. Pasamos solo el ID a Stripe.
    // En /api/stripe/success leeremos por ese ID, crearemos el user real,
    // y borraremos el pending.
    //
    // Requiere migración SQL — ver supabase/migration_pending_registrations.sql
    // ──────────────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12)

    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_registrations')
      .insert({
        email,
        password_hash: passwordHash,
        nombre,
        despacho: despacho || null,
        ciudad: ciudad || null,
        tel: tel || null,
        plan: canonicalPlan,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      })
      .select()
      .single()

    if (pendingError) {
      console.error('Pending registration insert error:', pendingError)
      return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 500 })
    }

    // Build session params — metadata SOLO contiene el pending_id
    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: { pending_id: pending.id },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}?payment=cancelled`,
      locale: 'es',
      // Trial de 7 días — alinea con la promesa de "7 días de garantía".
      // Comentar la siguiente línea si NO quieres trial automático.
      subscription_data: { trial_period_days: 7 },
    }

    if (promotionCodeId) {
      sessionParams.discounts = [{ promotion_code: promotionCodeId }]
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'No se pudo iniciar el pago. Intenta de nuevo.' }, { status: 500 })
  }
}
