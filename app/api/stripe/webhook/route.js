import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { nombre, email, password, despacho, ciudad, plan } = session.metadata

    try {
      // Check if user already exists
      const { data: existing } = await supabaseAdmin.from('users').select('id, plan').eq('email', email).maybeSingle()
      if (existing) {
        // Reactivate plan if account was inactive
        await supabaseAdmin.from('users').update({
          plan: plan || 'mensual',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        }).eq('id', existing.id)
        console.log('Account reactivated:', email)
        return NextResponse.json({ received: true })
      }

      // Create Supabase Auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true
      })
      if (authError) throw authError

      // Save to users table with stripe customer id
      const { data: user, error: userError } = await supabaseAdmin.from('users').insert({
        id: authUser.user.id,
        email,
        name: nombre,
        role: 'arq',
        plan: plan || 'mensual',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      }).select().single()
      if (userError) throw userError

      // Create initial project
      const { data: project } = await supabaseAdmin.from('projects').insert({
        user_id: user.id,
        nombre: (despacho || nombre) + ' - Proyecto 1',
        cliente: '', ubicacion: ciudad || '',
        arquitecto: nombre, presupuesto: 0, pres_ejercido: 0, pres_pagado: 0,
        etapa_actual: 'Por iniciar', architect_email: email
      }).select().single()

      if (project) {
        await supabaseAdmin.from('project_stages').insert({
          project_id: project.id, nombre: 'Proyecto arquitectonico',
          porcentaje: 0, fechas: 'Por definir', estatus: 'Pendiente', orden: 0
        })
      }

      console.log('✅ Account created for:', email)
    } catch (err) {
      console.error('Error creating account after payment:', err)
    }
  }

  // Handle subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    try {
      await supabaseAdmin.from('users')
        .update({ plan: 'inactivo' })
        .eq('stripe_subscription_id', subscription.id)
      console.log('Subscription cancelled:', subscription.id)
    } catch (err) {
      console.error('Error updating cancelled subscription:', err)
    }
  }

  // Handle failed payment
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object
    try {
      await supabaseAdmin.from('users')
        .update({ plan: 'inactivo' })
        .eq('stripe_customer_id', invoice.customer)
      console.log('Payment failed, account suspended:', invoice.customer)
    } catch (err) {
      console.error('Error suspending account:', err)
    }
  }

  return NextResponse.json({ received: true })
}
