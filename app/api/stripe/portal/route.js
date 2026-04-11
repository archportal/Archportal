import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  try {
    const { userId } = await request.json()

    // Get user's stripe_customer_id
    const { data: user } = await supabaseAdmin.from('users').select('stripe_customer_id, email').eq('id', userId).single()

    if (!user?.stripe_customer_id) {
      return NextResponse.json({ error: 'No se encontró una suscripción activa de Stripe para este usuario.' }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: process.env.NEXT_PUBLIC_APP_URL,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Customer portal error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
