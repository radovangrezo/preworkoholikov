import { MERCH_STRIPE_CURRENCY } from '@/lib/config/merch'
import type { MerchOrderRow, MerchTotals } from '@/lib/merch/types'
import { ROUTES } from '@/lib/site'
import { stripeClient } from '@/lib/stripe/client'

const CHECKOUT_LOCALE = 'sk' as const
const CANCELLED_QUERY = 'zrusene=1'
const CHECKOUT_EXPIRY_MINUTES = 60
const SECONDS_PER_MINUTE = 60

/** Distinguishes merch from book sessions in the one shared webhook. */
export const MERCH_ORDER_TYPE = 'merch'
const INTEGRATION_IDENTIFIER = 'rozpravky-merch-kfbtwnqd'

export async function createMerchCheckoutSession(params: {
  order: MerchOrderRow
  totals: MerchTotals
  baseUrl: string
}): Promise<{ id: string; url: string }> {
  const { order, totals, baseUrl } = params

  const session = await stripeClient().checkout.sessions.create({
    mode: 'payment',
    locale: CHECKOUT_LOCALE,
    integration_identifier: INTEGRATION_IDENTIFIER,
    customer_email: order.email,
    client_reference_id: order.id,
    metadata: metadata(order),
    payment_intent_data: { metadata: metadata(order) },
    line_items: totals.lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: MERCH_STRIPE_CURRENCY,
        unit_amount: line.unitPriceCents,
        product_data: {
          name: line.name,
          ...(line.imageUrl ? { images: [line.imageUrl] } : {}),
        },
      },
    })),
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: totals.shippingRateName ?? 'Doprava',
          fixed_amount: {
            amount: totals.shippingCents,
            currency: MERCH_STRIPE_CURRENCY,
          },
        },
      },
    ],
    expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRY_MINUTES * SECONDS_PER_MINUTE,
    success_url: `${baseUrl}${ROUTES.merchThankYou}?token=${order.public_token}`,
    cancel_url: `${baseUrl}${ROUTES.merchCart}?${CANCELLED_QUERY}`,
  })

  if (!session.url) {
    throw new Error(`Stripe merch session ${session.id} has no checkout URL`)
  }

  return { id: session.id, url: session.url }
}

function metadata(order: MerchOrderRow): Record<string, string> {
  return {
    order_type: MERCH_ORDER_TYPE,
    order_id: order.id,
    order_number: order.order_number,
  }
}
