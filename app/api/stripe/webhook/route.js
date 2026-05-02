// app/api/stripe/webhook/route.js
//
// Webhook handler de Stripe para mantener users.* sincronizado con la realidad de Stripe.
//
// Eventos que escuchamos:
//   - customer.subscription.created  → primer registro (también lo maneja /success, idempotente)
//   - customer.subscription.updated  → cambios de status (trialing → active, etc.)
//   - customer.subscription.deleted  → cancelación definitiva
//   - invoice.payment_succeeded      → cobro OK del ciclo
//   - invoice.payment_failed         → cobro falló (tarjeta vencida, fondos insuficientes)
//
// IMPORTANTE: este endpoint NUNCA debe procesar JSON con request.json() — Stripe necesita el
// raw body para verificar la firma. Usamos request.text().

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

// Mapea price_id de Stripe → nombre canónico del plan en nuestra DB
function planFromPriceId(priceId) {
  if (!priceId) return null
  if (priceId === process.env.STRIPE_PRICE_BASICO) return 'mensual'
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'trimestral'
  if (priceId === process.env.STRIPE_PRICE_DESPACHO) return 'anual'
  return null
}

// Helper: convierte timestamp Unix de Stripe a ISO string
const toISO = (unixTs) => unixTs ? new Date(unixTs * 1000).toISOString() : null

// ──────────────────────────────────────────────────────────────────
// Handler: subscription.created / subscription.updated
// ──────────────────────────────────────────────────────────────────
async function handleSubscriptionChange(subscription) {
  const customerId = subscription.customer
  const status = subscription.status // trialing, active, past_due, canceled, unpaid, incomplete, incomplete_expired
  const priceId = subscription.items?.data?.[0]?.price?.id
  const plan = planFromPriceId(priceId)

  // Buscar user por customer_id
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, plan')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (!user) {
    console.warn('[webhook] subscription change for unknown customer:', customerId)
    return
  }

  // Statuses que cuentan como "cuenta activa con acceso"
  const activeStatuses = ['trialing', 'active', 'past_due']
  const isActive = activeStatuses.includes(status)

  const update = {
    stripe_subscription_id: subscription.id,
    subscription_status: status,
    trial_end: toISO(subscription.trial_end),
    current_period_end: toISO(subscription.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
  }

  // Si está activa y conocemos el plan → actualizar plan
  // Si fue cancelada/unpaid → marcar como inactivo
  if (isActive && plan) {
    update.plan = plan
  } else if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
    update.plan = 'inactivo'
  }

  const { error } = await supabaseAdmin.from('users').update(update).eq('id', user.id)
  if (error) {
    console.error('[webhook] failed to update user:', error)
    throw error
  }
  console.log(`[webhook] user ${user.id} updated: status=${status} plan=${update.plan}`)
}

// ──────────────────────────────────────────────────────────────────
// Handler: subscription.deleted (cancelación definitiva)
// ──────────────────────────────────────────────────────────────────
async function handleSubscriptionCanceled(subscription) {
  const customerId = subscription.customer

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (!user) return

  await supabaseAdmin.from('users').update({
    plan: 'inactivo',
    subscription_status: 'canceled',
    cancel_at_period_end: false,
  }).eq('id', user.id)

  console.log(`[webhook] user ${user.id} canceled`)
}

// ──────────────────────────────────────────────────────────────────
// Handler: invoice.payment_succeeded (cobro exitoso)
// ──────────────────────────────────────────────────────────────────
async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (!user) return

  await supabaseAdmin.from('users').update({
    subscription_status: 'active',
    last_payment_at: new Date().toISOString(),
  }).eq('id', user.id)

  console.log(`[webhook] payment succeeded for user ${user.id}`)
}

// ──────────────────────────────────────────────────────────────────
// Handler: invoice.payment_failed (cobro falló)
// ──────────────────────────────────────────────────────────────────
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, name')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (!user) return

  await supabaseAdmin.from('users').update({
    subscription_status: 'past_due',
  }).eq('id', user.id)

  console.log(`[webhook] payment failed for user ${user.id}`)

  // Stripe manda email automático al usuario sobre el cobro fallido.
  // Si quieres mandar email custom adicional, agrégalo aquí con Resend.
}

// ──────────────────────────────────────────────────────────────────
// POST handler — entry point
// ──────────────────────────────────────────────────────────────────
export async function POST(request) {
  const body = await request.text() // RAW body — no usar request.json()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  if (!WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook] signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[webhook] received:', event.type, event.id)

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object)
        break
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      default:
        // Ignoramos otros eventos — no es error, simplemente no nos interesan
        break
    }
  } catch (err) {
    console.error(`[webhook] error handling ${event.type}:`, err)
    // Devolvemos 200 igualmente para que Stripe no reintente cuando el error es nuestro
    // (los errores quedan en logs de Vercel — los revisamos después).
    return NextResponse.json({ received: true, error: err.message })
  }

  return NextResponse.json({ received: true })
}

// IMPORTANTE: deshabilitar body parsing en Next.js para preservar raw body.
// En App Router de Next 13+ esto NO es necesario porque request.text() ya da raw.
// Pero por si Next.js cambia el comportamiento, declaramos runtime explícitamente:
export const runtime = 'nodejs'
