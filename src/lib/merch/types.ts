import type { MerchOrderStatus } from '@/lib/config/merch'
import type { PricedLine, PrintfulShippingRate } from '@/lib/printful/types'

/** What the browser stores and sends. Deliberately carries no prices. */
export type CartLine = {
  syncVariantId: number
  quantity: number
}

/** Cart line plus the display data the browser needs, cached locally for rendering. */
export type CartLineDisplay = CartLine & {
  productId: number
  name: string
  size: string | null
  color: string | null
  priceCents: number
  imageUrl: string | null
}

export type MerchCheckoutInput = {
  lines: CartLine[]
  name: string
  surname: string
  email: string
  phone: string | null
  countryCode: string
  address1: string
  city: string
  zip: string
  /** Which Printful shipping option the customer chose; null means cheapest. */
  shippingRateId: string | null
}

export type MerchTotals = {
  lines: PricedLine[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  shippingRateId: string | null
  shippingRateName: string | null
  /** Every option Printful offered, so the customer can choose. */
  availableRates: PrintfulShippingRate[]
}

export type MerchValidationErrors = Record<string, string>

export type MerchValidationResult =
  | { ok: true; data: MerchCheckoutInput }
  | { ok: false; errors: MerchValidationErrors }

export type MerchOrderRow = {
  id: string
  order_number: string
  public_token: string
  status: MerchOrderStatus
  customer_name: string
  customer_surname: string
  email: string
  phone: string | null
  country_code: string
  address1: string
  city: string
  zip: string
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
  currency: string
  shipping_rate_id: string | null
  shipping_rate_name: string | null
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  printful_order_id: string | null
  printful_error: string | null
  tracking_url: string | null
  paid_at: string | null
  shipped_at: string | null
  confirmation_email_sent_at: string | null
  shipped_email_sent_at: string | null
  created_at: string
  updated_at: string
}

export type MerchOrderItemRow = {
  id: string
  order_id: string
  sync_variant_id: number
  variant_id: number
  name: string
  size: string | null
  color: string | null
  unit_price_cents: number
  quantity: number
  image_url: string | null
}

export type MerchOrderWithItems = {
  order: MerchOrderRow
  items: MerchOrderItemRow[]
}
