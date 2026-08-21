/**
 * Meta (Facebook) Pixel. The ID is not a secret — it ships in the HTML of every page —
 * so it lives here next to the other site constants rather than in .env.
 */
export const META_PIXEL_ID = '1584238096408590'

export const META_PIXEL_SCRIPT_SRC = 'https://connect.facebook.net/en_US/fbevents.js'

/**
 * Meta's <noscript> fallback image is deliberately absent: consent is stored in the
 * browser and read with JavaScript, so a visitor without it can never have granted any.
 */

/**
 * Google Analytics 4. The measurement ID is public too, for the same reason.
 */
export const GA_MEASUREMENT_ID = 'G-9WV5DLMGYQ'

export function gaScriptSrc(measurementId: string): string {
  return `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
}

/**
 * Consent Mode v2. Every signal starts denied: gtag.js loads for everyone, which is what
 * makes the tag detectable, but it stores nothing on the device and identifies nobody
 * until the visitor agrees. Granting flips all four at once.
 */
export const GA_CONSENT_SIGNALS = [
  'ad_storage',
  'ad_user_data',
  'ad_personalization',
  'analytics_storage',
] as const

export type GaConsentValue = 'granted' | 'denied'

export function gaConsentPayload(value: GaConsentValue): Record<string, GaConsentValue> {
  return Object.fromEntries(GA_CONSENT_SIGNALS.map((signal) => [signal, value]))
}

/** How long gtag.js holds a hit back waiting for a consent update, in milliseconds. */
export const GA_CONSENT_WAIT_MS = 500
