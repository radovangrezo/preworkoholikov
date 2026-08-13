const CENTS_IN_EURO = 100
const DECIMAL_SEPARATOR_SK = ','

/** Formats cents the way the site displays prices, e.g. 1499 -> "€14,99". */
export function formatEur(cents: number): string {
  return `€${toAmountString(cents).replace('.', DECIMAL_SEPARATOR_SK)}`
}

/** Formats cents as a machine-readable decimal, e.g. 1499 -> "14.99". */
export function toAmountString(cents: number): string {
  return (cents / CENTS_IN_EURO).toFixed(2)
}
