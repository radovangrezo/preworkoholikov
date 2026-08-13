import {
  FREE_SHIPPING_FROM_CENTS,
  PRODUCT,
  SHIPPING_CENTS,
  type Country,
  type DeliveryMethod,
} from '@/lib/config/commerce'
import type { OrderTotals } from '@/lib/orders/types'

const WEIGHT_DECIMALS = 3

/**
 * The only place an order total is ever computed. The browser sends a quantity and
 * a delivery choice, never a price, so a tampered request cannot change what we charge.
 */
export function calculateTotals(
  quantity: number,
  country: Country,
  deliveryMethod: DeliveryMethod,
): OrderTotals {
  const subtotalCents = PRODUCT.unitPriceCents * quantity
  const shippingCents = calculateShipping(subtotalCents, country, deliveryMethod)

  return {
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    weightKg: roundWeight(PRODUCT.weightKg * quantity),
  }
}

function calculateShipping(
  subtotalCents: number,
  country: Country,
  deliveryMethod: DeliveryMethod,
): number {
  if (FREE_SHIPPING_FROM_CENTS !== null && subtotalCents >= FREE_SHIPPING_FROM_CENTS) {
    return 0
  }
  return SHIPPING_CENTS[country][deliveryMethod]
}

function roundWeight(kg: number): number {
  return Number(kg.toFixed(WEIGHT_DECIMALS))
}
