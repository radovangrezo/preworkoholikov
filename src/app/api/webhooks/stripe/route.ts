import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { ENV, requireEnv } from '@/lib/env'
import { fulfillPaidOrder } from '@/lib/orders/fulfillment'
import {
  getOrderItems,
  markCancelledOnce,
  markPaidOnce,
  releaseStock,
} from '@/lib/orders/repository'
import { stripeClient } from '@/lib/stripe/client'

export const runtime = 'nodejs'

const PAID_EVENT = 'checkout.session.completed'
/** Stripe emits this when an unfinished checkout times out. */
const EXPIRED_EVENT = 'checkout.session.expired'

export async function POST(request: Request): Promise<NextResponse> {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // Signature verification needs the untouched body, so read it as text.
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      requireEnv(ENV.stripeWebhookSecret),
    )
  } catch (error) {
    console.error('[stripe-webhook] signature verification failed', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== PAID_EVENT && event.type !== EXPIRED_EVENT) {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const orderId = session.metadata?.order_id ?? session.client_reference_id
  if (!orderId) {
    console.error(`[stripe-webhook] session ${session.id} carries no order reference`)
    return NextResponse.json({ received: true })
  }

  if (event.type === EXPIRED_EVENT) {
    return releaseAbandonedCheckout(orderId)
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true })
  }

  let order
  try {
    order = await markPaidOnce(orderId, resolvePaymentIntentId(session))
  } catch (error) {
    // Answer with 5xx so Stripe retries: the payment succeeded and we must not lose it.
    console.error('[stripe-webhook] could not mark order paid', error)
    return NextResponse.json({ error: 'Order update failed' }, { status: 500 })
  }

  if (!order) {
    // Stripe delivers events at least once; this one was already handled.
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Packeta and email failures are recorded rather than retried, so a paid order is
  // never rolled back and the customer is never charged twice.
  const outcome = await fulfillPaidOrder(order)
  if (outcome.errors.length > 0) {
    console.error(`[stripe-webhook] order ${order.order_number} needs attention`, outcome.errors)
  }

  return NextResponse.json({ received: true })
}

/**
 * The customer never finished paying, so the copies held for them go back on the shelf.
 * The single-transition guard means a repeated event cannot release the same copies twice.
 */
async function releaseAbandonedCheckout(orderId: string): Promise<NextResponse> {
  try {
    const cancelled = await markCancelledOnce(orderId)
    if (!cancelled) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    const items = await getOrderItems(orderId)
    const quantity = items.reduce((total, item) => total + item.quantity, 0)
    if (quantity > 0) {
      await releaseStock(quantity)
    }

    return NextResponse.json({ received: true, released: quantity })
  } catch (error) {
    // 5xx so Stripe retries; otherwise the copies stay reserved forever.
    console.error('[stripe-webhook] could not release an expired checkout', error)
    return NextResponse.json({ error: 'Stock release failed' }, { status: 500 })
  }
}

function resolvePaymentIntentId(session: Stripe.Checkout.Session): string | null {
  if (typeof session.payment_intent === 'string') return session.payment_intent
  return session.payment_intent?.id ?? null
}
