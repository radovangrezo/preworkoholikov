import { ENV, optionalEnv, requireEnv } from '@/lib/env'
import { toAmountString } from '@/lib/money'
import { PACKETA_CURRENCY, PACKETA_VALUE_RATE } from '@/lib/config/commerce'
import { SITE_URL } from '@/lib/site'
import type { OrderRow } from '@/lib/orders/types'

/** Customer-facing tracking page. */
const PACKETA_TRACKING_URL = 'https://tracking.packeta.com/sk/?id='

/** Prepaid by card, so nothing is collected on delivery. */
const NO_CASH_ON_DELIVERY = 0

/** Mirrors Packeta's PacketAttributes. Keys are sent to the API verbatim. */
export type PacketAttributes = {
  number: string
  name: string
  surname: string
  email?: string
  phone?: string
  addressId: string
  cod: number
  currency: string
  value: string
  weight: number
  eshop?: string
  street?: string
  houseNumber?: string
  city?: string
  zip?: string
}

/**
 * Maps a paid order onto Packeta's packet attributes.
 *
 * addressId carries two different meanings: for pickup points it is the point id
 * chosen in the widget, for home delivery it is the id of the home-delivery carrier
 * (discoverable with scripts/packeta-carriers.mjs).
 */
export function buildPacketAttributes(order: OrderRow): PacketAttributes {
  const base: PacketAttributes = {
    number: order.order_number,
    name: order.customer_name,
    surname: order.customer_surname,
    email: order.email,
    phone: order.phone,
    addressId: resolveAddressId(order),
    cod: NO_CASH_ON_DELIVERY,
    currency: PACKETA_CURRENCY[order.country],
    // Declared value of the contents, used for claims. Shipping is not part of it,
    // and it must be expressed in the packet's own currency.
    value: toAmountString(Math.round(order.subtotal_cents * PACKETA_VALUE_RATE[order.country])),
    weight: order.weight_kg,
    eshop: optionalEnv(ENV.packetaEshopName) ?? new URL(SITE_URL).hostname,
  }

  if (order.delivery_method === 'home') {
    return {
      ...base,
      street: order.street ?? undefined,
      houseNumber: order.house_number ?? undefined,
      city: order.city ?? undefined,
      zip: order.zip ?? undefined,
    }
  }

  return base
}

function resolveAddressId(order: OrderRow): string {
  if (order.delivery_method === 'pickup_point') {
    if (!order.pickup_point_id) {
      throw new Error(`Order ${order.order_number} has no pickup point`)
    }
    return order.pickup_point_id
  }

  return requireEnv(
    order.country === 'SK' ? ENV.packetaCarrierIdHomeSk : ENV.packetaCarrierIdHomeCz,
  )
}

export function trackingUrl(barcode: string): string {
  return `${PACKETA_TRACKING_URL}${encodeURIComponent(barcode)}`
}
