/** Shapes we consume from Printful's v1 API. Only the fields the shop actually uses. */

export type PrintfulProductSummary = {
  id: number
  name: string
  thumbnailUrl: string
  variantCount: number
}

/** A summary with its cheapest available price, which is what product cards show. */
export type PrintfulProductListing = PrintfulProductSummary & {
  fromPriceCents: number | null
}

export type PrintfulVariant = {
  /** Store variant id — used when creating an order. */
  syncVariantId: number
  /** Catalog variant id — required by the shipping rate endpoint. */
  variantId: number
  name: string
  size: string | null
  color: string | null
  /** Customer-facing price in cents, derived from Printful's retail_price. */
  priceCents: number
  currency: string
  available: boolean
  imageUrl: string | null
}

export type PrintfulProduct = {
  id: number
  name: string
  thumbnailUrl: string
  variants: PrintfulVariant[]
}

export type PrintfulRecipient = {
  name: string
  address1: string
  city: string
  countryCode: string
  zip: string
  email?: string
  phone?: string
}

export type PrintfulShippingRate = {
  id: string
  name: string
  rateCents: number
  currency: string
  minDeliveryDays: number | null
  maxDeliveryDays: number | null
}

/** One line of a cart, as the server understands it after re-pricing. */
export type PricedLine = {
  syncVariantId: number
  variantId: number
  name: string
  size: string | null
  color: string | null
  unitPriceCents: number
  quantity: number
  imageUrl: string | null
}
