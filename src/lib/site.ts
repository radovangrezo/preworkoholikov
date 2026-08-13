import { CURRENCY, PRODUCT } from '@/lib/config/commerce'
import { formatEur, toAmountString } from '@/lib/money'

export const SITE_URL = 'https://www.preworkoholikov.sk'

export const BOOK = {
  title: 'Rozprávky pre workoholikov',
  author: 'Radovan Andrej Grežo',
  // genitive case for phrases like "kniha od ..."
  authorGenitive: 'Radovana Andreja Greža',
  description:
    '42 príbehov o sebaklamoch, ktoré si nahovárame, aby sme v kancelárii nevyskočili z okna',
  priceDisplay: formatEur(PRODUCT.unitPriceCents),
  price: toAmountString(PRODUCT.unitPriceCents),
  priceCurrency: CURRENCY,
  language: 'sk',
}

/** Publication date. Until it passes, every order is a pre-order. */
export const RELEASE_DATE = '2026-09-14'

export const RELEASE_DATE_DISPLAY = new Intl.DateTimeFormat('sk-SK', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${RELEASE_DATE}T00:00:00Z`))

/** True while the book has not been published yet. */
export function isPreorder(now: Date = new Date()): boolean {
  return now.getTime() < new Date(`${RELEASE_DATE}T00:00:00Z`).getTime()
}

/**
 * Label for every buy button. Call it during render, never at module scope, or the value
 * freezes into the prerendered page.
 */
export function buyCtaLabel(): string {
  return isPreorder() ? 'Predobjednať' : 'Kúpiť'
}

/** Line shown under the buy button while the book is forthcoming; null once it is out. */
export function releaseNotice(): string | null {
  return isPreorder() ? `kniha vychádza ${RELEASE_DATE_DISPLAY}` : null
}

/** schema.org availability, kept in step with the button. */
export function availabilitySchema(): string {
  return isPreorder() ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock'
}

/**
 * Tells the customer when to expect their order, on the thank-you page and in the
 * confirmation email. Written as a function so the wording stops mentioning a
 * pre-order the moment the book is out, rather than going stale.
 */
export function shippingNotice(): string {
  return isPreorder()
    ? `Kniha vychádza ${RELEASE_DATE_DISPLAY}. Hneď po vydaní vám ju odošleme a pošleme e-mail so sledovaním zásielky.`
    : 'Keď zásielku odošleme, pošleme vám e-mail so sledovaním.'
}

/** Internal routes of the shop. */
export const ROUTES = {
  checkout: '/pokladna',
  thankYou: '/dakujeme',
  terms: '/obchodne-podmienky',
  privacy: '/ochrana-osobnych-udajov',
  withdrawal: '/odstupenie-od-zmluvy',
}

export const OG_IMAGE = {
  path: '/images/og-image.jpg',
  width: 1200,
  height: 630,
}

export const MARTINUS_PRODUCT_URL =
  'https://www.martinus.sk/?uItem=3860317&z=TTS79C&utm_source=z%3DTTS79C&utm_medium=url&utm_campaign=partner'
export const MARTINUS_NAME = 'Martinus'
