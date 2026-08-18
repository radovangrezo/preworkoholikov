import { MERCH_ORDER_STATUS } from '@/lib/config/merch'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type {
  MerchCheckoutInput,
  MerchOrderItemRow,
  MerchOrderRow,
  MerchOrderWithItems,
  MerchTotals,
} from '@/lib/merch/types'

const ORDERS_TABLE = 'merch_orders'
const ITEMS_TABLE = 'merch_order_items'

export async function createPendingMerchOrder(
  input: MerchCheckoutInput,
  totals: MerchTotals,
): Promise<MerchOrderRow> {
  const db = supabaseAdmin()

  const { data, error } = await db
    .from(ORDERS_TABLE)
    .insert({
      status: MERCH_ORDER_STATUS.PENDING,
      customer_name: input.name,
      customer_surname: input.surname,
      email: input.email,
      phone: input.phone,
      country_code: input.countryCode,
      address1: input.address1,
      city: input.city,
      zip: input.zip,
      subtotal_cents: totals.subtotalCents,
      shipping_cents: totals.shippingCents,
      total_cents: totals.totalCents,
      shipping_rate_id: totals.shippingRateId,
      shipping_rate_name: totals.shippingRateName,
    })
    .select('*')
    .single<MerchOrderRow>()

  if (error || !data) {
    throw new Error(`Could not create merch order: ${error?.message ?? 'no row returned'}`)
  }

  const { error: itemsError } = await db.from(ITEMS_TABLE).insert(
    totals.lines.map((line) => ({
      order_id: data.id,
      sync_variant_id: line.syncVariantId,
      variant_id: line.variantId,
      name: line.name,
      size: line.size,
      color: line.color,
      unit_price_cents: line.unitPriceCents,
      quantity: line.quantity,
      image_url: line.imageUrl,
    })),
  )

  if (itemsError) {
    throw new Error(`Could not create merch order items: ${itemsError.message}`)
  }

  return data
}

export async function attachMerchStripeSession(
  orderId: string,
  sessionId: string,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from(ORDERS_TABLE)
    .update({ stripe_session_id: sessionId })
    .eq('id', orderId)

  if (error) throw new Error(`Could not attach Stripe session: ${error.message}`)
}

/** Single transition, so a retried webhook cannot order from Printful twice. */
export async function markMerchPaidOnce(
  orderId: string,
  paymentIntentId: string | null,
): Promise<MerchOrderRow | null> {
  return transitionOnce(orderId, MERCH_ORDER_STATUS.PENDING, {
    status: MERCH_ORDER_STATUS.PAID,
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id: paymentIntentId,
  })
}

export async function markMerchCancelledOnce(orderId: string): Promise<MerchOrderRow | null> {
  return transitionOnce(orderId, MERCH_ORDER_STATUS.PENDING, {
    status: MERCH_ORDER_STATUS.CANCELLED,
  })
}

export async function markMerchShippedOnce(
  orderId: string,
  trackingUrl: string | null,
): Promise<MerchOrderRow | null> {
  return transitionOnce(orderId, MERCH_ORDER_STATUS.PAID, {
    status: MERCH_ORDER_STATUS.SHIPPED,
    shipped_at: new Date().toISOString(),
    tracking_url: trackingUrl,
  })
}

async function transitionOnce(
  orderId: string,
  fromStatus: string,
  patch: Record<string, unknown>,
): Promise<MerchOrderRow | null> {
  const { data, error } = await supabaseAdmin()
    .from(ORDERS_TABLE)
    .update(patch)
    .eq('id', orderId)
    .eq('status', fromStatus)
    .select('*')
    .maybeSingle<MerchOrderRow>()

  if (error) throw new Error(`Could not update merch order: ${error.message}`)
  return data ?? null
}

export async function saveMerchPrintfulResult(
  orderId: string,
  printfulOrderId: string,
): Promise<void> {
  await updateOrder(orderId, { printful_order_id: printfulOrderId, printful_error: null })
}

export async function saveMerchPrintfulError(orderId: string, message: string): Promise<void> {
  await updateOrder(orderId, { printful_error: message })
}

export async function markMerchConfirmationSent(orderId: string): Promise<void> {
  await updateOrder(orderId, { confirmation_email_sent_at: new Date().toISOString() })
}

export async function markMerchShippedEmailSent(orderId: string): Promise<void> {
  await updateOrder(orderId, { shipped_email_sent_at: new Date().toISOString() })
}

export async function getMerchOrderItems(orderId: string): Promise<MerchOrderItemRow[]> {
  const { data, error } = await supabaseAdmin()
    .from(ITEMS_TABLE)
    .select('*')
    .eq('order_id', orderId)

  if (error) throw new Error(`Could not load merch order items: ${error.message}`)
  return (data ?? []) as MerchOrderItemRow[]
}

export async function getMerchOrderByPublicToken(
  token: string,
): Promise<MerchOrderWithItems | null> {
  const { data, error } = await supabaseAdmin()
    .from(ORDERS_TABLE)
    .select('*')
    .eq('public_token', token)
    .maybeSingle<MerchOrderRow>()

  if (error) throw new Error(`Could not load merch order: ${error.message}`)
  if (!data) return null

  return { order: data, items: await getMerchOrderItems(data.id) }
}

/** Used by the Printful webhook, which identifies orders by its own id. */
export async function getMerchOrderByPrintfulId(
  printfulOrderId: string,
): Promise<MerchOrderRow | null> {
  const { data, error } = await supabaseAdmin()
    .from(ORDERS_TABLE)
    .select('*')
    .eq('printful_order_id', printfulOrderId)
    .maybeSingle<MerchOrderRow>()

  if (error) throw new Error(`Could not find merch order: ${error.message}`)
  return data ?? null
}

/** Paid merch orders that Printful has accepted and that have not shipped yet. */
export async function listMerchOrdersAwaitingDispatch(limit: number): Promise<MerchOrderRow[]> {
  const { data, error } = await supabaseAdmin()
    .from(ORDERS_TABLE)
    .select('*')
    .eq('status', MERCH_ORDER_STATUS.PAID)
    .not('printful_order_id', 'is', null)
    .order('paid_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(`Could not list merch orders awaiting dispatch: ${error.message}`)
  return (data ?? []) as MerchOrderRow[]
}

async function updateOrder(orderId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabaseAdmin().from(ORDERS_TABLE).update(patch).eq('id', orderId)
  if (error) throw new Error(`Could not update merch order ${orderId}: ${error.message}`)
}
