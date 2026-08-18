import { isCountry } from '@/lib/config/commerce'
import { MAX_MERCH_CART_LINES, MAX_MERCH_ITEM_QUANTITY } from '@/lib/config/merch'
import type {
  CartLine,
  MerchValidationErrors,
  MerchValidationResult,
} from '@/lib/merch/types'

const LIMITS = { name: 64, surname: 64, email: 254, phone: 20, address1: 128, city: 64, zip: 16 }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
/** Postal formats vary too much across the EU to validate beyond shape. */
const ZIP_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 -]{1,14}$/
/** Printful rate ids look like STANDARD or PRINTFUL_FAST. */
const SHIPPING_RATE_ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/

export function validateMerchCheckout(payload: unknown): MerchValidationResult {
  if (typeof payload !== 'object' || payload === null) {
    return { ok: false, errors: { form: 'Neplatné údaje objednávky.' } }
  }

  const body = payload as Record<string, unknown>
  const errors: MerchValidationErrors = {}

  const lines = parseLines(body.lines, errors)

  const name = asTrimmed(body.name)
  if (!name) errors.name = 'Zadajte meno.'
  else if (name.length > LIMITS.name) errors.name = `Meno môže mať najviac ${LIMITS.name} znakov.`

  const surname = asTrimmed(body.surname)
  if (!surname) errors.surname = 'Zadajte priezvisko.'
  else if (surname.length > LIMITS.surname)
    errors.surname = `Priezvisko môže mať najviac ${LIMITS.surname} znakov.`

  const email = asTrimmed(body.email)
  if (!email) errors.email = 'Zadajte e-mail.'
  else if (email.length > LIMITS.email || !EMAIL_PATTERN.test(email))
    errors.email = 'Zadajte platný e-mail.'

  const phoneRaw = asTrimmed(body.phone)
  if (phoneRaw && phoneRaw.length > LIMITS.phone) {
    errors.phone = `Telefón môže mať najviac ${LIMITS.phone} znakov.`
  }

  const countryCode = asTrimmed(body.countryCode).toUpperCase()
  if (!isCountry(countryCode)) errors.countryCode = 'Vyberte krajinu doručenia.'

  const address1 = asTrimmed(body.address1)
  if (!address1) errors.address1 = 'Zadajte ulicu a číslo domu.'
  else if (address1.length > LIMITS.address1)
    errors.address1 = `Adresa môže mať najviac ${LIMITS.address1} znakov.`

  const city = asTrimmed(body.city)
  if (!city) errors.city = 'Zadajte mesto.'
  else if (city.length > LIMITS.city)
    errors.city = `Mesto môže mať najviac ${LIMITS.city} znakov.`

  const zip = asTrimmed(body.zip)
  if (!zip) errors.zip = 'Zadajte PSČ.'
  else if (zip.length > LIMITS.zip || !ZIP_PATTERN.test(zip)) errors.zip = 'Zadajte platné PSČ.'

  // Optional: absent means "cheapest". Whatever arrives is re-checked against the rates
  // Printful actually offers, so this only needs to be a plausible shape.
  const shippingRateId = asTrimmed(body.shippingRateId) || null
  if (shippingRateId && !SHIPPING_RATE_ID_PATTERN.test(shippingRateId)) {
    errors.shippingRateId = 'Vyberte spôsob dopravy.'
  }

  if (body.termsAccepted !== true) {
    errors.termsAccepted = 'Pre dokončenie objednávky potvrďte obchodné podmienky.'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    data: {
      lines,
      name,
      surname,
      email,
      phone: phoneRaw || null,
      countryCode,
      address1,
      city,
      zip,
      shippingRateId,
    },
  }
}

/** The cart comes from the browser, so every line is re-checked before it is trusted. */
function parseLines(value: unknown, errors: MerchValidationErrors): CartLine[] {
  if (!Array.isArray(value) || value.length === 0) {
    errors.lines = 'Košík je prázdny.'
    return []
  }
  if (value.length > MAX_MERCH_CART_LINES) {
    errors.lines = 'Košík obsahuje príliš veľa položiek.'
    return []
  }

  const lines: CartLine[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      errors.lines = 'Košík obsahuje neplatnú položku.'
      return []
    }
    const line = entry as Record<string, unknown>
    const syncVariantId = Number(line.syncVariantId)
    const quantity = Number(line.quantity)

    if (!Number.isInteger(syncVariantId) || syncVariantId <= 0) {
      errors.lines = 'Košík obsahuje neplatnú položku.'
      return []
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_MERCH_ITEM_QUANTITY) {
      errors.lines = `Počet kusov musí byť od 1 do ${MAX_MERCH_ITEM_QUANTITY}.`
      return []
    }

    lines.push({ syncVariantId, quantity })
  }

  return lines
}

function asTrimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
