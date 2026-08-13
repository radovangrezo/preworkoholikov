/**
 * Single source of truth for everything money- and shipping-related.
 * Kept free of server-only imports so both the checkout UI and the API can use it.
 */

export const COUNTRIES = ['SK', 'CZ'] as const
export type Country = (typeof COUNTRIES)[number]

export const DELIVERY_METHODS = ['pickup_point', 'home'] as const
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]

export const CURRENCY = 'EUR'
/** Stripe expects lowercase ISO codes. */
export const STRIPE_CURRENCY = 'eur'

/**
 * Packeta rejects a packet whose currency is not that of the destination country,
 * even when nothing is collected on delivery. Customers are always charged in EUR
 * by Stripe; this only affects what we declare to the carrier.
 */
export const PACKETA_CURRENCY: Record<Country, string> = { SK: 'EUR', CZ: 'CZK' }

/**
 * Rough EUR -> packet-currency rate, used only for the declared value of the contents
 * (what a claim would be based on). Exactness is not critical at these amounts, but
 * review it occasionally so a lost Czech parcel is not declared at a tenth of its worth.
 */
export const PACKETA_VALUE_RATE: Record<Country, number> = { SK: 1, CZ: 25 }

/**
 * Payment methods we tell customers about, on the checkout page and in the terms.
 * This list is copy only — what is actually accepted is decided by the Stripe
 * Dashboard (Settings -> Payment methods). Keep the two in sync.
 */
export const PAYMENT_METHOD_LABELS = ['platobná karta', 'Apple Pay', 'Google Pay', 'Link']

export const PRODUCT = {
  sku: 'RPW-001',
  unitPriceCents: 1499,
  /** Shipping weight of one copy, in kg. Packeta requires a weight per packet. */
  weightKg: 0.4,
}

export const MAX_QUANTITY_PER_ORDER = 10

/** Shipping price per destination country and delivery method, in cents. */
export const SHIPPING_CENTS: Record<Country, Record<DeliveryMethod, number>> = {
  SK: { pickup_point: 200, home: 300 },
  CZ: { pickup_point: 200, home: 300 },
}

/** Set to a cents amount to enable free shipping above that order value. */
export const FREE_SHIPPING_FROM_CENTS: number | null = null

/**
 * VAT already contained in the displayed prices, by delivery country: Slovakia applies the
 * reduced book rate, Czechia zero-rates books. The gross price is the same either way, so
 * this changes only how much of it is tax, never what the customer pays.
 */
export const VAT_RATE_PERCENT: Record<Country, number> = { SK: 5, CZ: 0 }

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  SHIPPED: 'shipped',
  CANCELLED: 'cancelled',
} as const
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const COUNTRY_LABELS: Record<Country, string> = {
  SK: 'Slovensko',
  CZ: 'Česko',
}

/** Genitive case, for phrases like "doručujeme do ...". */
export const COUNTRY_LABELS_GENITIVE: Record<Country, string> = {
  SK: 'Slovenska',
  CZ: 'Česka',
}

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  pickup_point: 'Výdajné miesto alebo Z-BOX',
  home: 'Doručenie na adresu',
}

export function isCountry(value: unknown): value is Country {
  return typeof value === 'string' && (COUNTRIES as readonly string[]).includes(value)
}

export function isDeliveryMethod(value: unknown): value is DeliveryMethod {
  return typeof value === 'string' && (DELIVERY_METHODS as readonly string[]).includes(value)
}
