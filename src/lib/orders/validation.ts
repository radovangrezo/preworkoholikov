import {
  MAX_QUANTITY_PER_ORDER,
  isCountry,
  isDeliveryMethod,
  type Country,
} from '@/lib/config/commerce'
import type { CheckoutInput, ValidationErrors, ValidationResult } from '@/lib/orders/types'

/** Maximum lengths, mirrored from Packeta's API so a packet cannot fail after payment. */
const LIMITS = {
  name: 32,
  surname: 32,
  email: 254,
  phone: 20,
  street: 64,
  houseNumber: 16,
  city: 32,
  pickupPointName: 64,
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
const ZIP_PATTERN = /^\d{5}$/
const PICKUP_POINT_ID_PATTERN = /^\d{1,10}$/
const NORMALIZED_PHONE_PATTERN = /^\+\d{9,15}$/
const PHONE_SEPARATORS = /[\s\-()/.]/g

const DIAL_PREFIX: Record<Country, string> = { SK: '+421', CZ: '+420' }

/**
 * Validates and normalises a checkout submission. Everything reaching the database,
 * Stripe, Packeta or an email template goes through here first.
 */
export function validateCheckout(payload: unknown): ValidationResult {
  if (typeof payload !== 'object' || payload === null) {
    return { ok: false, errors: { form: 'Neplatné údaje objednávky.' } }
  }

  const body = payload as Record<string, unknown>
  const errors: ValidationErrors = {}

  const quantity = Number(body.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ORDER) {
    errors.quantity = `Zadajte počet kusov od 1 do ${MAX_QUANTITY_PER_ORDER}.`
  }

  const name = asTrimmedString(body.name)
  if (!name) errors.name = 'Zadajte meno.'
  else if (name.length > LIMITS.name) errors.name = `Meno môže mať najviac ${LIMITS.name} znakov.`

  const surname = asTrimmedString(body.surname)
  if (!surname) errors.surname = 'Zadajte priezvisko.'
  else if (surname.length > LIMITS.surname)
    errors.surname = `Priezvisko môže mať najviac ${LIMITS.surname} znakov.`

  const email = asTrimmedString(body.email)
  if (!email) errors.email = 'Zadajte e-mail.'
  else if (email.length > LIMITS.email || !EMAIL_PATTERN.test(email))
    errors.email = 'Zadajte platný e-mail.'

  const country = body.country
  if (!isCountry(country)) errors.country = 'Vyberte krajinu doručenia.'

  // Phone normalisation needs a known country, so it runs only once that is valid.
  let phone = ''
  const rawPhone = asTrimmedString(body.phone)
  if (!rawPhone) {
    errors.phone = 'Zadajte telefónne číslo. Packeta ho potrebuje na oznámenie o zásielke.'
  } else if (isCountry(country)) {
    phone = normalizePhone(rawPhone, country)
    if (!NORMALIZED_PHONE_PATTERN.test(phone) || phone.length > LIMITS.phone)
      errors.phone = 'Zadajte platné telefónne číslo, napríklad 0912 345 678.'
  }

  const deliveryMethod = body.deliveryMethod
  if (!isDeliveryMethod(deliveryMethod)) errors.deliveryMethod = 'Vyberte spôsob doručenia.'

  let pickupPoint: CheckoutInput['pickupPoint']
  let address: CheckoutInput['address']

  if (deliveryMethod === 'pickup_point') {
    const pickupPointId = asTrimmedString(body.pickupPointId)
    if (!PICKUP_POINT_ID_PATTERN.test(pickupPointId)) {
      errors.pickupPointId = 'Vyberte výdajné miesto alebo Z-BOX.'
    } else {
      pickupPoint = {
        id: pickupPointId,
        name: asTrimmedString(body.pickupPointName).slice(0, LIMITS.pickupPointName),
      }
    }
  } else if (deliveryMethod === 'home') {
    const street = asTrimmedString(body.street)
    const houseNumber = asTrimmedString(body.houseNumber)
    const city = asTrimmedString(body.city)
    const zip = asTrimmedString(body.zip).replace(/\s/g, '')

    if (!street) errors.street = 'Zadajte ulicu.'
    else if (street.length > LIMITS.street)
      errors.street = `Ulica môže mať najviac ${LIMITS.street} znakov.`

    if (!houseNumber) errors.houseNumber = 'Zadajte číslo domu.'
    else if (houseNumber.length > LIMITS.houseNumber)
      errors.houseNumber = `Číslo domu môže mať najviac ${LIMITS.houseNumber} znakov.`

    if (!city) errors.city = 'Zadajte mesto.'
    else if (city.length > LIMITS.city)
      errors.city = `Mesto môže mať najviac ${LIMITS.city} znakov.`

    if (!ZIP_PATTERN.test(zip)) errors.zip = 'Zadajte PSČ v tvare 82109.'

    if (!errors.street && !errors.houseNumber && !errors.city && !errors.zip) {
      address = { street, houseNumber, city, zip }
    }
  }

  if (body.termsAccepted !== true) {
    errors.termsAccepted = 'Pre dokončenie objednávky potvrďte obchodné podmienky.'
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    data: {
      quantity,
      name,
      surname,
      email,
      phone,
      country: country as Country,
      deliveryMethod: deliveryMethod as CheckoutInput['deliveryMethod'],
      pickupPoint,
      address,
    },
  }
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Turns local formats such as "0912 345 678" or "00421..." into "+421912345678". */
function normalizePhone(raw: string, country: Country): string {
  const compact = raw.replace(PHONE_SEPARATORS, '')
  if (compact.startsWith('+')) return compact
  if (compact.startsWith('00')) return `+${compact.slice(2)}`
  if (compact.startsWith('0')) return `${DIAL_PREFIX[country]}${compact.slice(1)}`
  return `${DIAL_PREFIX[country]}${compact}`
}
