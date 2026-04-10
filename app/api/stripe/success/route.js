import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status === 'paid') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?payment=success`)
    }
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?payment=failed`)
  } catch {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}`)
  }
}
