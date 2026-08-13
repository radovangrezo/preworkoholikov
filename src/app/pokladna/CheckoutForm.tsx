'use client'

import Script from 'next/script'
import { useState } from 'react'
import {
  COUNTRIES,
  COUNTRY_LABELS,
  DELIVERY_LABELS,
  DELIVERY_METHODS,
  PAYMENT_METHOD_LABELS,
  SHIPPING_CENTS,
  type Country,
  type DeliveryMethod,
} from '@/lib/config/commerce'
import { formatEur } from '@/lib/money'
import { calculateTotals } from '@/lib/orders/pricing'
import type { ValidationErrors } from '@/lib/orders/types'
import { ROUTES } from '@/lib/site'

const PACKETA_WIDGET_SRC = 'https://widget.packeta.com/v6/www/js/library.js'
const CHECKOUT_ENDPOINT = '/api/checkout'

type PacketaPoint = {
  id: number | string
  name?: string
  street?: string
  city?: string
}

declare global {
  interface Window {
    Packeta?: {
      Widget: {
        pick(
          apiKey: string,
          callback: (point: PacketaPoint | null) => void,
          options?: Record<string, unknown>,
        ): void
      }
    }
  }
}

type PickupPoint = { id: string; name: string }

const INPUT_CLASS =
  'w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-black outline-none focus:border-yellow'
const LABEL_CLASS = 'block text-sm font-medium text-black mb-1'
const ERROR_CLASS = 'mt-1 text-sm text-red-700'

export function CheckoutForm({
  packetaApiKey,
  maxQuantity,
}: {
  packetaApiKey: string
  /** Capped by remaining stock, so the selector cannot offer copies we do not have. */
  maxQuantity: number
}) {
  const [quantity, setQuantity] = useState(1)
  const [country, setCountry] = useState<Country>('SK')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup_point')
  const [pickupPoint, setPickupPoint] = useState<PickupPoint | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const totals = calculateTotals(quantity, country, deliveryMethod)

  function openPacketaWidget() {
    if (!window.Packeta) {
      setErrors((current) => ({
        ...current,
        pickupPointId: 'Výber miesta sa nepodarilo otvoriť. Obnovte stránku a skúste znova.',
      }))
      return
    }

    window.Packeta.Widget.pick(
      packetaApiKey,
      (point) => {
        if (!point) return
        setPickupPoint({ id: String(point.id), name: describePoint(point) })
        setErrors((current) => ({ ...current, pickupPointId: '' }))
      },
      { language: 'sk', country: country.toLowerCase() },
    )
  }

  function changeCountry(next: Country) {
    setCountry(next)
    // Points are country-specific, so a previous choice no longer applies.
    setPickupPoint(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const form = new FormData(event.currentTarget)
    const payload = {
      quantity,
      country,
      deliveryMethod,
      name: form.get('name'),
      surname: form.get('surname'),
      email: form.get('email'),
      phone: form.get('phone'),
      pickupPointId: pickupPoint?.id ?? '',
      pickupPointName: pickupPoint?.name ?? '',
      street: form.get('street'),
      houseNumber: form.get('houseNumber'),
      city: form.get('city'),
      zip: form.get('zip'),
      termsAccepted,
    }

    try {
      const response = await fetch(CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok) {
        setErrors(result.errors ?? { form: 'Objednávku sa nepodarilo vytvoriť.' })
        setSubmitting(false)
        return
      }

      window.location.href = result.url
    } catch {
      setErrors({ form: 'Objednávku sa nepodarilo vytvoriť. Skúste to prosím znova.' })
      setSubmitting(false)
    }
  }

  return (
    <>
      <Script src={PACKETA_WIDGET_SRC} strategy="lazyOnload" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <fieldset className="bg-white rounded-[20px] p-6 md:p-8">
          <legend className="text-lg font-bold text-black mb-4">1. Počet kusov</legend>
          <label className={LABEL_CLASS} htmlFor="quantity">
            Počet kusov
          </label>
          <select
            id="quantity"
            name="quantity"
            className={INPUT_CLASS}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          >
            {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <FieldError message={errors.quantity} />
        </fieldset>

        <fieldset className="bg-white rounded-[20px] p-6 md:p-8">
          <legend className="text-lg font-bold text-black mb-4">2. Vaše údaje</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Meno" name="name" error={errors.name} autoComplete="given-name" />
            <Field
              label="Priezvisko"
              name="surname"
              error={errors.surname}
              autoComplete="family-name"
            />
            <Field
              label="E-mail"
              name="email"
              type="email"
              error={errors.email}
              autoComplete="email"
            />
            <Field
              label="Telefón"
              name="phone"
              type="tel"
              error={errors.phone}
              autoComplete="tel"
              hint="Packeta ho potrebuje na oznámenie o zásielke."
            />
          </div>
        </fieldset>

        <fieldset className="bg-white rounded-[20px] p-6 md:p-8">
          <legend className="text-lg font-bold text-black mb-4">3. Doručenie</legend>

          <label className={LABEL_CLASS} htmlFor="country">
            Krajina
          </label>
          <select
            id="country"
            className={INPUT_CLASS}
            value={country}
            onChange={(event) => changeCountry(event.target.value as Country)}
          >
            {COUNTRIES.map((code) => (
              <option key={code} value={code}>
                {COUNTRY_LABELS[code]}
              </option>
            ))}
          </select>
          <FieldError message={errors.country} />

          <div className="mt-6 flex flex-col gap-3">
            {DELIVERY_METHODS.map((method) => (
              <label
                key={method}
                className="flex items-center gap-3 rounded-xl border border-black/15 px-4 py-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={method}
                  checked={deliveryMethod === method}
                  onChange={() => setDeliveryMethod(method)}
                />
                <span className="flex-1 text-black">{DELIVERY_LABELS[method]}</span>
                <span className="font-bold text-black">
                  {formatEur(SHIPPING_CENTS[country][method])}
                </span>
              </label>
            ))}
          </div>
          <FieldError message={errors.deliveryMethod} />

          {deliveryMethod === 'pickup_point' ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={openPacketaWidget}
                className="rounded-full bg-yellow px-6 py-3 font-bold text-white"
              >
                {pickupPoint ? 'Zmeniť miesto' : 'Vybrať výdajné miesto alebo Z-BOX'}
              </button>
              {pickupPoint ? (
                <p className="mt-3 text-black">
                  Vybrané miesto: <strong>{pickupPoint.name}</strong>
                </p>
              ) : null}
              <FieldError message={errors.pickupPointId} />
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field
                label="Ulica"
                name="street"
                error={errors.street}
                autoComplete="address-line1"
              />
              <Field label="Číslo domu" name="houseNumber" error={errors.houseNumber} />
              <Field label="Mesto" name="city" error={errors.city} autoComplete="address-level2" />
              <Field label="PSČ" name="zip" error={errors.zip} autoComplete="postal-code" />
            </div>
          )}
        </fieldset>

        <div className="bg-white rounded-[20px] p-6 md:p-8">
          <h2 className="text-lg font-bold text-black mb-4">4. Súhrn</h2>
          <SummaryRow label={`Kniha × ${quantity}`} value={formatEur(totals.subtotalCents)} />
          <SummaryRow
            label={`Doprava — ${DELIVERY_LABELS[deliveryMethod]}`}
            value={formatEur(totals.shippingCents)}
          />
          <div className="mt-3 flex justify-between border-t-2 border-black pt-3 text-xl font-bold text-black">
            <span>Celkom</span>
            <span>{formatEur(totals.totalCents)}</span>
          </div>

          <label className="mt-6 flex items-start gap-3 text-sm text-black">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              className="mt-1"
            />
            <span>
              Súhlasím s{' '}
              <a href={ROUTES.terms} className="underline" target="_blank" rel="noreferrer">
                obchodnými podmienkami
              </a>{' '}
              a{' '}
              <a href={ROUTES.privacy} className="underline" target="_blank" rel="noreferrer">
                spracovaním osobných údajov
              </a>
              .
            </span>
          </label>
          <FieldError message={errors.termsAccepted} />

          {errors.form ? <p className={ERROR_CLASS}>{errors.form}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-yellow px-8 py-4 text-lg font-bold text-white disabled:opacity-60"
          >
            {submitting ? 'Presmerúvame na platbu…' : `Zaplatiť ${formatEur(totals.totalCents)}`}
          </button>
          <p className="mt-3 text-center text-sm text-black/60">
            Platba cez Stripe: {PAYMENT_METHOD_LABELS.join(', ')}. Platobné údaje nezadávate na
            našej stránke.
          </p>
        </div>
      </form>
    </>
  )
}

function Field({
  label,
  name,
  error,
  type = 'text',
  autoComplete,
  hint,
}: {
  label: string
  name: string
  error?: string
  type?: string
  autoComplete?: string
  hint?: string
}) {
  return (
    <div>
      <label className={LABEL_CLASS} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className={INPUT_CLASS}
      />
      {hint ? <p className="mt-1 text-xs text-black/60">{hint}</p> : null}
      <FieldError message={error} />
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className={ERROR_CLASS}>{message}</p>
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-black">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function describePoint(point: PacketaPoint): string {
  return [point.name, point.street, point.city].filter(Boolean).join(', ')
}
