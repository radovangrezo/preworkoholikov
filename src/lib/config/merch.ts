/**
 * Merch is fulfilled and shipped by Printful, so it shares nothing with the book's
 * Packeta flow beyond Stripe. Kept free of server-only imports so the cart can use it.
 *
 * Merch ships to the same two countries as the book, so the country list and labels are
 * reused from the commerce config rather than duplicated here.
 */
import type { Country } from '@/lib/config/commerce'

export const MERCH_CURRENCY = 'EUR'
export const MERCH_STRIPE_CURRENCY = 'eur'

/**
 * VAT already contained in merch prices, by delivery country. Merch does not qualify for
 * the reduced rate books get, so these are the standard rates. Printful's retail_price is
 * the gross amount the customer pays, so this describes what that price already includes;
 * it is never added on top.
 */
export const MERCH_VAT_RATE_PERCENT: Record<Country, number> = { SK: 23, CZ: 21 }

export const MAX_MERCH_ITEM_QUANTITY = 10
/** Guards against a cart built by hand in the console. */
export const MAX_MERCH_CART_LINES = 20

/** How long product data is cached before Printful is asked again, in seconds. */
export const MERCH_CACHE_SECONDS = 3600

/**
 * Display order on the shop pages, by Printful product id — Printful's own ordering is not
 * meaningful. Anything not listed here (a product added later) still appears, after these,
 * so a new product is never hidden by forgetting to add it.
 */
export const MERCH_PRODUCT_ORDER: number[] = [
  459911365, // Hrnček takmer NAJLEPŠÍ ŠÉF (biely)
  459911463, // Hrnček takmer NAJLEPŠÍ ŠÉF (čierny)
  459911597, // Poznámkový blok Meetingový meškač
  459911572, // Taška Mohla som kopať kanály
  459911578, // Taška Mohol som kopať kanály
  456510998, // Unisex tričko
  456511345, // Poznámkový blok Viac projektov
  456511361, // Detské bodíčko
  456511426, // Plátená taška čierna
]

/**
 * Sizes the shop sells, by Printful product id. A product not listed here is sold in
 * every size Printful has synced, and sizeless products are unaffected.
 *
 * Kept here rather than unsynced in Printful so the variants stay set up: offering a
 * size again is a one-line edit. The trade-off is that Printful is no longer the only
 * place that decides what is for sale, so unsync there instead if a size is gone for good.
 */
export const MERCH_SIZES: Record<number, string[]> = {
  456510998: ['S', 'M', 'L', 'XL'], // Unisex tričko
}

export const MERCH_ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  SHIPPED: 'shipped',
  CANCELLED: 'cancelled',
} as const
export type MerchOrderStatus = (typeof MERCH_ORDER_STATUS)[keyof typeof MERCH_ORDER_STATUS]

