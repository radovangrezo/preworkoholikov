import type { Country, DeliveryMethod, OrderStatus } from '@/lib/config/commerce'

/** A validated checkout submission. */
export type CheckoutInput = {
  quantity: number
  name: string
  surname: string
  email: string
  phone: string
  country: Country
  deliveryMethod: DeliveryMethod
  /** Present when deliveryMethod is 'pickup_point'. */
  pickupPoint?: { id: string; name: string }
  /** Present when deliveryMethod is 'home'. */
  address?: { street: string; houseNumber: string; city: string; zip: string }
}

export type OrderTotals = {
  subtotalCents: number
  shippingCents: number
  totalCents: number
  weightKg: number
}

/** Field name -> Slovak message, keyed to match the checkout form inputs. */
export type ValidationErrors = Record<string, string>

export type ValidationResult =
  | { ok: true; data: CheckoutInput }
  | { ok: false; errors: ValidationErrors }

/** Shape of a public.orders row, snake_case as it comes out of Postgres. */
export type OrderRow = {
  id: string
  order_number: string
  public_token: string
  status: OrderStatus
  customer_name: string
  customer_surname: string
  email: string
  phone: string
  country: Country
  delivery_method: DeliveryMethod
  pickup_point_id: string | null
  pickup_point_name: string | null
  street: string | null
  house_number: string | null
  city: string | null
  zip: string | null
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
  currency: string
  weight_kg: number
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  packeta_packet_id: string | null
  packeta_barcode: string | null
  packeta_status: string | null
  packeta_error: string | null
  paid_at: string | null
  shipped_at: string | null
  confirmation_email_sent_at: string | null
  shipped_email_sent_at: string | null
  created_at: string
  updated_at: string
}

export type OrderItemRow = {
  id: string
  order_id: string
  sku: string
  title: string
  unit_price_cents: number
  quantity: number
}

export type OrderWithItems = {
  order: OrderRow
  items: OrderItemRow[]
}
