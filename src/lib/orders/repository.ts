import { ORDER_STATUS, PRODUCT } from '@/lib/config/commerce'
import { BOOK } from '@/lib/site'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type {
  CheckoutInput,
  OrderItemRow,
  OrderRow,
  OrderTotals,
  OrderWithItems,
} from '@/lib/orders/types'

const ORDERS_TABLE = 'orders'
const ORDER_ITEMS_TABLE = 'order_items'

export async function createPendingOrder(
  input: CheckoutInput,
  totals: OrderTotals,
): Promise<OrderRow> {
  const db = supabaseAdmin()

  const { data, error } = await db
    .from(ORDERS_TABLE)
    .insert({
      status: ORDER_STATUS.PENDING,
      customer_name: input.name,
      customer_surname: input.surname,
      email: input.email,
      phone: input.phone,
      country: input.country,
      delivery_method: input.deliveryMethod,
      pickup_point_id: input.pickupPoint?.id ?? null,
      pickup_point_name: input.pickupPoint?.name ?? null,
      street: input.address?.street ?? null,
      house_number: input.address?.houseNumber ?? null,
      city: input.address?.city ?? null,
      zip: input.address?.zip ?? null,
      subtotal_cents: totals.subtotalCents,
      shipping_cents: totals.shippingCents,
      total_cents: totals.totalCents,
      weight_kg: totals.weightKg,
    })
    .select('*')
    .single<OrderRow>()

  if (error || !data) {
    throw new Error(`Could not create order: ${error?.message ?? 'no row returned'}`)
  }

  const { error: itemError } = await db.from(ORDER_ITEMS_TABLE).insert({
    order_id: data.id,
    sku: PRODUCT.sku,
    title: BOOK.title,
    unit_price_cents: PRODUCT.unitPriceCents,
    quantity: input.quantity,
  })

  if (itemError) {
    throw new Error(`Could not create order items: ${itemError.message}`)
  }

  return data
}

export async function attachStripeSession(orderId: string, sessionId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from(ORDERS_TABLE)
    .update({ stripe_session_id: sessionId })
    .eq('id', orderId)

  if (error) {
    throw new Error(`Could not attach Stripe session: ${error.message}`)
  }
}

/**
 * Flips a pending order to paid, but only once. Stripe retries webhooks, so the
 * status guard is what stops a customer getting two packets and two emails:
 * a repeat delivery updates no rows and returns null.
 */
export async function markPaidOnce(
  orderId: string,
  paymentIntentId: string | null,
): Promise<OrderRow | null> {
  const { data, error } = await supabaseAdmin()
    .from(ORDERS_TABLE)
    .update({
      status: ORDER_STATUS.PAID,
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq('id', orderId)
    .eq('status', ORDER_STATUS.PENDING)
    .select('*')
    .maybeSingle<OrderRow>()

  if (error) {
    throw new Error(`Could not mark order paid: ${error.message}`)
  }

  return data ?? null
}

/** Same single-transition guard as markPaidOnce, for the dispatch step. */
export async function markShippedOnce(
  orderId: string,
  packetaStatus: string,
): Promise<OrderRow | null> {
  const { data, error } = await supabaseAdmin()
    .from(ORDERS_TABLE)
    .update({
      status: ORDER_STATUS.SHIPPED,
      shipped_at: new Date().toISOString(),
      packeta_status: packetaStatus,
    })
    .eq('id', orderId)
    .eq('status', ORDER_STATUS.PAID)
    .select('*')
    .maybeSingle<OrderRow>()

  if (error) {
    throw new Error(`Could not mark order shipped: ${error.message}`)
  }

  return data ?? null
}

export async function savePacketResult(
  orderId: string,
  packet: { packetId: string; barcode: string },
): Promise<void> {
  await updateOrder(orderId, {
    packeta_packet_id: packet.packetId,
    packeta_barcode: packet.barcode,
    packeta_error: null,
  })
}

export async function savePacketError(orderId: string, message: string): Promise<void> {
  await updateOrder(orderId, { packeta_error: message })
}

/**
 * Records the packet's current Packeta status. Set right after creation it becomes the
 * baseline that dispatch detection compares against.
 */
export async function savePacketStatus(orderId: string, statusCode: string): Promise<void> {
  await updateOrder(orderId, { packeta_status: statusCode })
}

export async function markConfirmationEmailSent(orderId: string): Promise<void> {
  await updateOrder(orderId, { confirmation_email_sent_at: new Date().toISOString() })
}

export async function markShippedEmailSent(orderId: string): Promise<void> {
  await updateOrder(orderId, { shipped_email_sent_at: new Date().toISOString() })
}

export async function getOrderByPublicToken(token: string): Promise<OrderWithItems | null> {
  const { data, error } = await supabaseAdmin()
    .from(ORDERS_TABLE)
    .select('*')
    .eq('public_token', token)
    .maybeSingle<OrderRow>()

  if (error) {
    throw new Error(`Could not load order: ${error.message}`)
  }
  if (!data) return null

  return { order: data, items: await getOrderItems(data.id) }
}

export async function getOrderItems(orderId: string): Promise<OrderItemRow[]> {
  const { data, error } = await supabaseAdmin()
    .from(ORDER_ITEMS_TABLE)
    .select('*')
    .eq('order_id', orderId)

  if (error) {
    throw new Error(`Could not load order items: ${error.message}`)
  }

  return (data ?? []) as OrderItemRow[]
}

/** Paid orders that already have a packet and are waiting for Packeta to dispatch. */
export async function listOrdersAwaitingDispatch(limit: number): Promise<OrderRow[]> {
  const { data, error } = await supabaseAdmin()
    .from(ORDERS_TABLE)
    .select('*')
    .eq('status', ORDER_STATUS.PAID)
    .not('packeta_packet_id', 'is', null)
    .order('paid_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Could not list orders awaiting dispatch: ${error.message}`)
  }

  return (data ?? []) as OrderRow[]
}

/**
 * Reserves copies for a checkout. Returns false when there are not enough left.
 * The database performs the test and the increment in one statement, so two
 * simultaneous checkouts cannot both succeed on the last copy.
 */
export async function claimStock(quantity: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin().rpc('claim_stock', {
    p_sku: PRODUCT.sku,
    p_quantity: quantity,
  })

  if (error) {
    throw new Error(`Could not claim stock: ${error.message}`)
  }

  return data === true
}

/** Returns copies to the pool when a checkout is abandoned or never starts. */
export async function releaseStock(quantity: number): Promise<void> {
  const { error } = await supabaseAdmin().rpc('release_stock', {
    p_sku: PRODUCT.sku,
    p_quantity: quantity,
  })

  if (error) {
    throw new Error(`Could not release stock: ${error.message}`)
  }
}

/** Copies still available to sell. */
export async function getAvailableStock(): Promise<number> {
  const { data, error } = await supabaseAdmin()
    .from('inventory')
    .select('total_printed, claimed')
    .eq('sku', PRODUCT.sku)
    .maybeSingle<{ total_printed: number; claimed: number }>()

  if (error) {
    throw new Error(`Could not read stock: ${error.message}`)
  }
  if (!data) return 0

  return Math.max(data.total_printed - data.claimed, 0)
}

/**
 * Cancels a pending order exactly once, mirroring markPaidOnce. Used when Stripe
 * reports the checkout expired, so the reserved copies are released only one time.
 */
export async function markCancelledOnce(orderId: string): Promise<OrderRow | null> {
  const { data, error } = await supabaseAdmin()
    .from(ORDERS_TABLE)
    .update({ status: ORDER_STATUS.CANCELLED })
    .eq('id', orderId)
    .eq('status', ORDER_STATUS.PENDING)
    .select('*')
    .maybeSingle<OrderRow>()

  if (error) {
    throw new Error(`Could not cancel order: ${error.message}`)
  }

  return data ?? null
}

async function updateOrder(orderId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabaseAdmin().from(ORDERS_TABLE).update(patch).eq('id', orderId)

  if (error) {
    throw new Error(`Could not update order ${orderId}: ${error.message}`)
  }
}
