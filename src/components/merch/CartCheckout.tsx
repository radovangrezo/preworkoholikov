'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useCart } from '@/components/merch/useCart'
import { COUNTRIES, COUNTRY_LABELS } from '@/lib/config/commerce'
import { MAX_MERCH_ITEM_QUANTITY } from '@/lib/config/merch'
import { inMillilitres } from '@/lib/merch/sizes'
import { formatEur } from '@/lib/money'
import { ROUTES } from '@/lib/site'

const CHECKOUT_ENDPOINT = '/api/merch/checkout'
const SHIPPING_ENDPOINT = '/api/merch/shipping'
/** Long enough that typing an address does not fire a request per keystroke. */
const QUOTE_DEBOUNCE_MS = 700

const INPUT_CLASS =
  'w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-black outline-none focus:border-yellow'
const LABEL_CLASS = 'block text-sm font-medium text-black mb-1'
const ERROR_CLASS = 'mt-1 text-sm text-red-700'

type Rate = {
  id: string
  name: string
  rateCents: number
  minDeliveryDays: number | null
  maxDeliveryDays: number | null
}

type Quote = {
  subtotalCents: number
  shippingCents: number
  totalCents: number
  shippingRateId: string | null
  rates: Rate[]
}

type Address = {
  name: string
  surname: string
  email: string
  phone: string
  countryCode: string
  address1: string
  city: string
  zip: string
}

const EMPTY_ADDRESS: Address = {
  name: '',
  surname: '',
  email: '',
  phone: '',
  countryCode: 'SK',
  address1: '',
  city: '',
  zip: '',
}

export function CartCheckout() {
  const { lines, subtotalCents, setQuantity, remove } = useCart()
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS)
  // null means "whatever Printful quotes cheapest" until the customer picks.
  const [shippingRateId, setShippingRateId] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Identifies the latest quote request so a slow earlier one cannot overwrite it.
  const quoteRequestId = useRef(0)

  const payload = {
    lines: lines.map((line) => ({ syncVariantId: line.syncVariantId, quantity: line.quantity })),
    ...address,
    phone: address.phone || null,
    shippingRateId,
    termsAccepted: true,
  }
  const payloadKey = JSON.stringify(payload)

  useEffect(() => {
    // An empty cart renders the empty state instead, so there is nothing to quote.
    if (lines.length === 0) return

    const requestId = ++quoteRequestId.current

    const timer = setTimeout(async () => {
      setQuoting(true)
      try {
        const response = await fetch(SHIPPING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadKey,
        })
        const result = await response.json()
        if (requestId !== quoteRequestId.current) return
        setQuote(response.ok && !result.incomplete ? result : null)
      } catch {
        if (requestId === quoteRequestId.current) setQuote(null)
      } finally {
        if (requestId === quoteRequestId.current) setQuoting(false)
      }
    }, QUOTE_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [payloadKey, lines.length])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      const response = await fetch(CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, termsAccepted }),
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

  if (lines.length === 0) {
    return (
      <div className="mt-8 rounded-[20px] bg-white p-6 md:p-8">
        <p className="text-lg text-black">Košík je prázdny.</p>
        <Link href={ROUTES.merch} className="mt-4 inline-block text-black underline">
          Prejsť do merchu
        </Link>
      </div>
    )
  }

  const update = (field: keyof Address) => (value: string) =>
    setAddress((current) => ({ ...current, [field]: value }))

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6" noValidate>
      <section className="rounded-[20px] bg-white p-6 md:p-8">
        <h2 className="mb-4 text-lg font-bold text-black">Položky</h2>
        <ul className="flex flex-col gap-4">
          {lines.map((line) => (
            <li key={line.syncVariantId} className="flex items-center gap-4">
              {line.imageUrl ? (
                <Image
                  src={line.imageUrl}
                  alt={inMillilitres(line.name)}
                  width={72}
                  height={72}
                  className="h-18 w-18 rounded-xl object-cover"
                />
              ) : null}
              <div className="flex-1">
                <p className="font-medium text-black">{inMillilitres(line.name)}</p>
                <p className="text-sm text-black/60">{formatEur(line.priceCents)} / ks</p>
              </div>
              <select
                aria-label="Počet kusov"
                className="rounded-xl border border-black/15 bg-white px-3 py-2 text-black"
                value={line.quantity}
                onChange={(event) => setQuantity(line.syncVariantId, Number(event.target.value))}
              >
                {Array.from({ length: MAX_MERCH_ITEM_QUANTITY }, (_, i) => i + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => remove(line.syncVariantId)}
                className="text-sm text-black/60 underline"
              >
                Odstrániť
              </button>
            </li>
          ))}
        </ul>
        {errors.lines ? <p className={ERROR_CLASS}>{errors.lines}</p> : null}
      </section>

      <section className="rounded-[20px] bg-white p-6 md:p-8">
        <h2 className="mb-4 text-lg font-bold text-black">Doručenie</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Meno" value={address.name} onChange={update('name')} error={errors.name} autoComplete="given-name" />
          <Field label="Priezvisko" value={address.surname} onChange={update('surname')} error={errors.surname} autoComplete="family-name" />
          <Field label="E-mail" type="email" value={address.email} onChange={update('email')} error={errors.email} autoComplete="email" />
          <Field label="Telefón (nepovinné)" type="tel" value={address.phone} onChange={update('phone')} error={errors.phone} autoComplete="tel" />
          <div className="md:col-span-2">
            <label className={LABEL_CLASS} htmlFor="countryCode">
              Krajina
            </label>
            <select
              id="countryCode"
              className={INPUT_CLASS}
              value={address.countryCode}
              onChange={(event) => update('countryCode')(event.target.value)}
            >
              {COUNTRIES.map((code) => (
                <option key={code} value={code}>
                  {COUNTRY_LABELS[code]}
                </option>
              ))}
            </select>
            {errors.countryCode ? <p className={ERROR_CLASS}>{errors.countryCode}</p> : null}
          </div>
          <div className="md:col-span-2">
            <Field label="Ulica a číslo domu" value={address.address1} onChange={update('address1')} error={errors.address1} autoComplete="address-line1" />
          </div>
          <Field label="Mesto" value={address.city} onChange={update('city')} error={errors.city} autoComplete="address-level2" />
          <Field label="PSČ" value={address.zip} onChange={update('zip')} error={errors.zip} autoComplete="postal-code" />
        </div>
      </section>

      <section className="rounded-[20px] bg-white p-6 md:p-8">
        <h2 className="mb-4 text-lg font-bold text-black">Spôsob dopravy</h2>
        {quote && quote.rates.length > 0 ? (
          <div className="flex flex-col gap-3">
            {quote.rates.map((rate) => (
              <label
                key={rate.id}
                className="flex items-center gap-3 rounded-xl border border-black/15 px-4 py-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="shippingRate"
                  value={rate.id}
                  checked={(shippingRateId ?? quote.shippingRateId) === rate.id}
                  onChange={() => setShippingRateId(rate.id)}
                />
                <span className="flex-1 text-black">
                  {rate.name}
                  {rate.minDeliveryDays ? (
                    <span className="block text-sm text-black/60">
                      doručenie {rate.minDeliveryDays}
                      {rate.maxDeliveryDays && rate.maxDeliveryDays !== rate.minDeliveryDays
                        ? `–${rate.maxDeliveryDays}`
                        : ''}{' '}
                      dní
                    </span>
                  ) : null}
                </span>
                <span className="font-bold text-black">{formatEur(rate.rateCents)}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-black/60">
            {quoting ? 'Počítame možnosti dopravy…' : 'Vyplňte adresu a zobrazíme možnosti dopravy.'}
          </p>
        )}
      </section>

      <section className="rounded-[20px] bg-white p-6 md:p-8">
        <h2 className="mb-4 text-lg font-bold text-black">Súhrn</h2>
        <Row label="Medzisúčet" value={formatEur(quote?.subtotalCents ?? subtotalCents)} />
        <Row
          label="Doprava"
          value={
            quoting
              ? 'počítame…'
              : quote
                ? formatEur(quote.shippingCents)
                : 'vyplňte adresu'
          }
        />
        <div className="mt-3 flex justify-between border-t-2 border-black pt-3 text-xl font-bold text-black">
          <span>Celkom</span>
          <span>{quote ? formatEur(quote.totalCents) : '—'}</span>
        </div>
        <p className="mt-2 text-sm text-black/60">
          Poštovné počíta Printful podľa vašej adresy a zvoleného spôsobu dopravy. Konečnú sumu
          vidíte pred platbou.
        </p>

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
        {errors.termsAccepted ? <p className={ERROR_CLASS}>{errors.termsAccepted}</p> : null}
        {errors.form ? <p className={ERROR_CLASS}>{errors.form}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-yellow px-8 py-4 text-lg font-bold text-white disabled:opacity-60"
        >
          {submitting ? 'Presmerúvame na platbu…' : 'Zaplatiť'}
        </button>
      </section>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
  autoComplete?: string
}) {
  const id = label.replace(/\s+/g, '-').toLowerCase()

  return (
    <div>
      <label className={LABEL_CLASS} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASS}
      />
      {error ? <p className={ERROR_CLASS}>{error}</p> : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-black">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
