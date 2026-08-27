/**
 * Printful measures mugs in fluid ounces, which says nothing to a customer here, so every
 * ounce figure the shop displays is restated in millilitres — a bare size ("11 oz") and a
 * variant name that carries one ("Hrnček … / 11 oz") alike. Sizes measured any other way
 * are left as Printful wrote them.
 *
 * Display only: the cart, the order sent to Printful and the database all keep Printful's
 * own wording, so nothing the shop shows can disagree with what is actually ordered.
 */

const ML_PER_FLUID_OUNCE = 29.5735
/** Capacities are quoted in fives, the way mugs are advertised: 11 oz reads as 325 ml. */
const ML_STEP = 5
const OUNCES = /(\d+(?:[.,]\d+)?)\s*oz\b/gi

export function inMillilitres(text: string): string {
  return text.replace(OUNCES, (_match, ounces: string) => `${toMillilitres(ounces)} ml`)
}

/** Whether a size is a capacity — something worth stating even when there is no choice. */
export function isVolume(size: string): boolean {
  return inMillilitres(size) !== size
}

function toMillilitres(ounces: string): number {
  const millilitres = Number(ounces.replace(',', '.')) * ML_PER_FLUID_OUNCE
  return Math.round(millilitres / ML_STEP) * ML_STEP
}
