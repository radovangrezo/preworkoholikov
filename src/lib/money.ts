const CENTS_IN_EURO = 100
const DECIMAL_SEPARATOR_SK = ','

/** Formats cents the way the site displays prices, e.g. 1499 -> "€14,99". */
export function formatEur(cents: number): string {
  return `€${toAmountString(cents).replace('.', DECIMAL_SEPARATOR_SK)}`
}

/** Formats cents as a machine-readable decimal, e.g. 1499 -> "14.99". */
export function toAmountString(cents: number): string {
  return toAmount(cents).toFixed(2)
}

/** Cents as a plain number, for the analytics that want an amount rather than a string. */
export function toAmount(cents: number): number {
  return cents / CENTS_IN_EURO
}
