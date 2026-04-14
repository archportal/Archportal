import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICE_IDS = {
  mensual:    process.env.STRIPE_PRICE_BASICO,
  trimestral: process.env.STRIPE_PRICE_PRO,
  anual:      process.env.STRIPE_PRICE_DESPACHO,
  monthly:    process.env.STRIPE_PRICE_BASICO,
  quarterly:  process.env.STRIPE_PRICE_PRO,
  annual:     process.env.STRIPE_PRICE_DESPACHO,
}

async function getPromotionCodeId(code) {
  try {
    const promoCodes = await stripe.promotionCodes.list({ code, active: true, limit: 1 })
    return promoCodes.data[0]?.id || null
  } catch { return null }
}

export async function POST(request) {
  try {
    const { plan, nombre, email, password, despacho, ciudad, coupon } = await request.json()

    const priceId = PRICE_IDS[plan]
    if (!priceId) {
      return NextResponse.json({ error: 'Plan no válido' }, { status: 400 })
    }

    // Build session params
    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: { nombre, email, password, despacho, ciudad, plan },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
      locale: 'es',
    }

    // Apply coupon if provided
    if (coupon) {
      sessionParams.discounts = [{ promotion_code: await getPromotionCodeId(coupon) }].filter(d => d.promotion_code)
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
