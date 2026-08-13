import { DELIVERY_LABELS, PRODUCT, STRIPE_CURRENCY } from '@/lib/config/commerce'
import type { OrderRow } from '@/lib/orders/types'
import { BOOK, OG_IMAGE, ROUTES, SITE_URL } from '@/lib/site'
import { stripeClient } from '@/lib/stripe/client'

const CHECKOUT_LOCALE = 'sk' as const
const CANCELLED_QUERY = 'zrusene=1'

/**
 * How long an unfinished checkout holds its reserved copies. Stripe allows 30 minutes
 * to 24 hours; the shorter this is, the sooner an abandoned cart frees its stock.
 */
const CHECKOUT_EXPIRY_MINUTES = 60
const SECONDS_PER_MINUTE = 60

/**
 * Tags these sessions in the Stripe Dashboard so this checkout flow can be compared
 * against others. Must stay stable, hence a constant rather than a per-request value.
 */
const INTEGRATION_IDENTIFIER = 'rozpravky-checkout-qmvtzlrf'

export type CheckoutSession = { id: string; url: string }

export async function createCheckoutSession(params: {
  order: OrderRow
  quantity: number
  baseUrl: string
}): Promise<CheckoutSession> {
  const { order, quantity, baseUrl } = params

  const session = await stripeClient().checkout.sessions.create({
    mode: 'payment',
    locale: CHECKOUT_LOCALE,
    integration_identifier: INTEGRATION_IDENTIFIER,
    // payment_method_types is deliberately omitted so Stripe picks the most relevant
    // eligible methods. Which methods are accepted is controlled in the Stripe
    // Dashboard (Settings -> Payment methods), not hardcoded here.
    customer_email: order.email,
    client_reference_id: order.id,
    metadata: orderMetadata(order),
    payment_intent_data: { metadata: orderMetadata(order) },
    line_items: [
      {
        quantity,
        price_data: {
          currency: STRIPE_CURRENCY,
          unit_amount: PRODUCT.unitPriceCents,
          product_data: {
            name: BOOK.title,
            description: BOOK.description,
            images: [`${SITE_URL}${OG_IMAGE.path}`],
          },
        },
      },
    ],
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: DELIVERY_LABELS[order.delivery_method],
          fixed_amount: {
            amount: order.shipping_cents,
            currency: STRIPE_CURRENCY,
          },
        },
      },
    ],
    expires_at:
      Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRY_MINUTES * SECONDS_PER_MINUTE,
    // The token, not the id, so the thank-you page cannot be enumerated.
    success_url: `${baseUrl}${ROUTES.thankYou}?token=${order.public_token}`,
    cancel_url: `${baseUrl}${ROUTES.checkout}?${CANCELLED_QUERY}`,
  })

  if (!session.url) {
    throw new Error(`Stripe session ${session.id} has no checkout URL`)
  }

  return { id: session.id, url: session.url }
}

function orderMetadata(order: OrderRow): Record<string, string> {
  return { order_id: order.id, order_number: order.order_number }
}
