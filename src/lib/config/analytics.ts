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
