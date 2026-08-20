import { MERCH_EXTRA_MOCKUPS } from '@/lib/merch/extra-mockups'
import type { PrintfulProduct, PrintfulVariant } from '@/lib/printful/types'

export type ProductImage = { src: string; alt: string }

/** Manifest key for variants that carry no colour. Mirrored in scripts/merch-mockups.mjs. */
const NO_COLOR_KEY = ''

/**
 * Every picture the product page shows for the chosen variant. Printful's own mockup
 * comes first and is fetched live, so a design changed in Printful shows up straight
 * away; the extra views behind it were generated once by `npm run merch:mockups`,
 * because the generator hands back URLs that expire within days.
 *
 * A product with no generated views simply shows the one image, which is what happens
 * to anything added to the shop before the script is run again.
 */
export function productImages(
  product: PrintfulProduct,
  variant: PrintfulVariant | null,
): ProductImage[] {
  const extras = MERCH_EXTRA_MOCKUPS[String(product.id)]?.[variant?.color ?? NO_COLOR_KEY] ?? []

  return [
    { src: variant?.imageUrl ?? product.thumbnailUrl, alt: product.name },
    ...extras.map((src, index) => ({ src, alt: `${product.name} – ďalší pohľad ${index + 1}` })),
  ]
}
