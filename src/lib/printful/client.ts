import { ENV, requireEnv } from '@/lib/env'
import {
  MERCH_CACHE_SECONDS,
  MERCH_CURRENCY,
  MERCH_PRODUCT_ORDER,
  MERCH_PRODUCT_THUMBNAILS,
  MERCH_SIZES,
} from '@/lib/config/merch'
import type {
  PrintfulProduct,
  PrintfulProductListing,
  PrintfulProductSummary,
  PrintfulRecipient,
  PrintfulShippingRate,
  PrintfulVariant,
} from '@/lib/printful/types'

const PRINTFUL_API = 'https://api.printful.com'
const REQUEST_TIMEOUT_MS = 20_000
const CENTS_PER_UNIT = 100

export class PrintfulError extends Error {}

/**
 * Printful's token is a server secret and its responses drive pricing, so nothing here
 * may run in the browser. Product reads are cached; anything that decides what a customer
 * pays is fetched fresh.
 */
async function call<T>(
  path: string,
  options: { method?: string; body?: unknown; revalidate?: number | false } = {},
): Promise<T> {
  const { method = 'GET', body, revalidate = false } = options

  let response: Response
  try {
    response = await fetch(`${PRINTFUL_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${requireEnv(ENV.printfulAccessKey)}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...(revalidate === false ? { cache: 'no-store' } : { next: { revalidate } }),
    })
  } catch (error) {
    throw new PrintfulError(`Printful ${method} ${path} failed: ${describe(error)}`)
  }

  const payload = (await response.json().catch(() => null)) as
    | { result?: unknown; error?: { message?: string } }
    | null

  if (!response.ok) {
    const message = payload?.error?.message ?? `HTTP ${response.status}`
    throw new PrintfulError(`Printful ${method} ${path} rejected: ${message}`)
  }

  return payload?.result as T
}

/**
 * Everything the shop sells. A product removed from the Printful store keeps its id and
 * goes on being returned by the API, only flagged `is_ignored` — so removed products are
 * filtered out here rather than quietly staying on sale.
 */
export async function listProducts(): Promise<PrintfulProductSummary[]> {
  const result = await call<
    { id: number; name: string; thumbnail_url: string; variants: number; is_ignored: boolean }[]
  >('/store/products', { revalidate: MERCH_CACHE_SECONDS })

  return (result ?? [])
    .filter((product) => !product.is_ignored)
    .map((product) => ({
      id: product.id,
      name: product.name,
      thumbnailUrl: thumbnailOf(product.id, product.thumbnail_url),
      variantCount: product.variants,
    }))
}

/**
 * Listing data plus the cheapest variant price, so cards can show a "from" price.
 * The product list alone carries no prices, hence the extra fetches — all cached.
 */
export async function listProductsWithPrices(): Promise<PrintfulProductListing[]> {
  const summaries = await listProducts()

  const listings = await Promise.all(
    summaries.map(async (summary) => {
      const product = await getProduct(summary.id)
      const prices = (product?.variants ?? [])
        .filter((variant) => variant.available)
        .map((variant) => variant.priceCents)

      return {
        ...summary,
        fromPriceCents: prices.length > 0 ? Math.min(...prices) : null,
      }
    }),
  )

  return listings.sort((a, b) => displayRank(a.id) - displayRank(b.id))
}

/** Unlisted products sort last, keeping Printful's relative order among themselves. */
function displayRank(productId: number): number {
  const index = MERCH_PRODUCT_ORDER.indexOf(productId)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

type RawVariant = {
  id: number
  sync_product_id: number
  is_ignored: boolean
  variant_id: number
  name: string
  size: string | null
  color: string | null
  retail_price: string
  currency: string
  synced: boolean
  availability_status: string
  files?: { type: string; preview_url: string }[]
  product?: { image?: string }
}

export async function getProduct(
  productId: number,
  options: { fresh?: boolean } = {},
): Promise<PrintfulProduct | null> {
  const result = await call<{
    sync_product: { id: number; name: string; thumbnail_url: string; is_ignored: boolean }
    sync_variants: RawVariant[]
  }>(`/store/products/${productId}`, {
    revalidate: options.fresh ? false : MERCH_CACHE_SECONDS,
  })

  // A removed product still answers on its own URL, so its page has to 404 by hand.
  if (!result?.sync_product || result.sync_product.is_ignored) return null

  return {
    id: result.sync_product.id,
    name: result.sync_product.name,
    thumbnailUrl: thumbnailOf(result.sync_product.id, result.sync_product.thumbnail_url),
    variants: (result.sync_variants ?? [])
      .filter((raw) => !raw.is_ignored && isOfferedSize(productId, raw.size ?? null))
      .map(toVariant),
  }
}

/** The picture that stands for a product, which the shop may override. */
function thumbnailOf(productId: number, printfulUrl: string): string {
  return MERCH_PRODUCT_THUMBNAILS[productId] ?? printfulUrl
}

/**
 * Whether the shop sells a size. Applied here rather than in the page, so a size the shop
 * has withdrawn is invisible to every caller — including the one that prices a basket,
 * which is what stops a cart built by hand from ordering it anyway.
 */
function isOfferedSize(productId: number, size: string | null): boolean {
  const offered = MERCH_SIZES[productId]
  if (!offered || size === null) return true
  return offered.includes(size)
}

function toVariant(raw: RawVariant): PrintfulVariant {
  const preview = raw.files?.find((file) => file.type === 'preview')

  return {
    syncVariantId: raw.id,
    variantId: raw.variant_id,
    name: raw.name,
    size: raw.size ?? null,
    color: raw.color ?? null,
    priceCents: toCents(raw.retail_price),
    currency: raw.currency,
    available: raw.synced && raw.availability_status === 'active',
    imageUrl: preview?.preview_url ?? raw.product?.image ?? null,
  }
}

/**
 * Single variant, always fetched fresh. This is the authority on what a customer pays:
 * the browser sends only ids and quantities, never a price.
 */
export async function getVariant(syncVariantId: number): Promise<PrintfulVariant | null> {
  // Note the shape: this endpoint returns the variant directly in `result`, whereas
  // /store/products/{id} wraps things in sync_product / sync_variants.
  const result = await call<RawVariant>(`/store/variants/${syncVariantId}`)
  if (!result?.id || result.is_ignored) return null
  if (!isOfferedSize(result.sync_product_id, result.size ?? null)) return null
  return toVariant(result)
}

/**
 * Live shipping cost for a basket. Printful's rate endpoint insists on the catalog
 * variant_id and rejects the store's sync_variant_id, which is why lines carry both.
 */
export async function getShippingRates(
  recipient: PrintfulRecipient,
  items: { variantId: number; quantity: number }[],
): Promise<PrintfulShippingRate[]> {
  const result = await call<
    {
      id: string
      name: string
      rate: string
      currency: string
      minDeliveryDays?: number
      maxDeliveryDays?: number
    }[]
  >('/shipping/rates', {
    method: 'POST',
    body: {
      recipient: toPrintfulRecipient(recipient),
      items: items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
      currency: MERCH_CURRENCY,
    },
  })

  return (result ?? []).map((rate) => ({
    id: rate.id,
    name: rate.name,
    rateCents: toCents(rate.rate),
    currency: rate.currency,
    minDeliveryDays: rate.minDeliveryDays ?? null,
    maxDeliveryDays: rate.maxDeliveryDays ?? null,
  }))
}

/** Cheapest option, which is what the shop quotes and charges. */
export function cheapestRate(rates: PrintfulShippingRate[]): PrintfulShippingRate | null {
  if (rates.length === 0) return null
  return rates.reduce((cheapest, rate) => (rate.rateCents < cheapest.rateCents ? rate : cheapest))
}

export async function createOrder(params: {
  externalId: string
  recipient: PrintfulRecipient
  items: { syncVariantId: number; quantity: number }[]
  /** true submits the order for fulfilment; false leaves it as a draft in Printful. */
  confirm: boolean
}): Promise<{ printfulOrderId: number; status: string }> {
  const result = await call<{ id: number; status: string }>(
    `/orders?confirm=${params.confirm ? '1' : '0'}`,
    {
      method: 'POST',
      body: {
        external_id: params.externalId,
        recipient: toPrintfulRecipient(params.recipient),
        items: params.items.map((item) => ({
          sync_variant_id: item.syncVariantId,
          quantity: item.quantity,
        })),
      },
    },
  )

  if (!result?.id) {
    throw new PrintfulError('Printful did not return an order id')
  }

  return { printfulOrderId: result.id, status: result.status }
}

export type PrintfulOrderStatus = {
  status: string
  trackingUrl: string | null
}

/**
 * Current state of a Printful order. Statuses are Printful's own: draft, pending,
 * inprocess, onhold, partial, fulfilled, canceled, failed.
 */
export async function getOrder(printfulOrderId: string): Promise<PrintfulOrderStatus | null> {
  const result = await call<{
    status?: string
    shipments?: { tracking_url?: string }[]
  }>(`/orders/${encodeURIComponent(printfulOrderId)}`)

  if (!result?.status) return null

  const tracking = (result.shipments ?? []).find((shipment) => shipment.tracking_url)

  return {
    status: result.status,
    trackingUrl: tracking?.tracking_url ?? null,
  }
}

function toPrintfulRecipient(recipient: PrintfulRecipient) {
  return {
    name: recipient.name,
    address1: recipient.address1,
    city: recipient.city,
    country_code: recipient.countryCode,
    zip: recipient.zip,
    ...(recipient.email ? { email: recipient.email } : {}),
    ...(recipient.phone ? { phone: recipient.phone } : {}),
  }
}

/** Printful returns money as decimal strings; cents avoid float drift. */
function toCents(amount: string): number {
  return Math.round(Number.parseFloat(amount) * CENTS_PER_UNIT)
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
