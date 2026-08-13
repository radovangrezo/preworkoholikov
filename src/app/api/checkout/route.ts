import { NextResponse } from 'next/server'
import { calculateTotals } from '@/lib/orders/pricing'
import {
  attachStripeSession,
  claimStock,
  createPendingOrder,
  getAvailableStock,
  releaseStock,
} from '@/lib/orders/repository'
import { validateCheckout } from '@/lib/orders/validation'
import { SITE_URL } from '@/lib/site'
import { createCheckoutSession } from '@/lib/stripe/checkout'

export const runtime = 'nodejs'

const GENERIC_ERROR = 'Objednávku sa nepodarilo vytvoriť. Skúste to prosím znova.'

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ errors: { form: 'Neplatný formát požiadavky.' } }, { status: 400 })
  }

  const validation = validateCheckout(payload)
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 })
  }

  const input = validation.data

  // Copies are reserved before any payment starts, so the print run cannot be oversold.
  let reserved: boolean
  try {
    reserved = await claimStock(input.quantity)
  } catch (error) {
    console.error('[checkout] stock check failed', error)
    return NextResponse.json({ errors: { form: GENERIC_ERROR } }, { status: 500 })
  }

  if (!reserved) {
    const available = await getAvailableStock().catch(() => 0)
    return NextResponse.json({ errors: { quantity: soldOutMessage(available) } }, { status: 409 })
  }

  try {
    // Prices come from our own constants, never from the request body.
    const totals = calculateTotals(input.quantity, input.country, input.deliveryMethod)
    const order = await createPendingOrder(input, totals)
    const session = await createCheckoutSession({
      order,
      quantity: input.quantity,
      baseUrl: resolveBaseUrl(request),
    })
    await attachStripeSession(order.id, session.id)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[checkout] could not start payment', error)
    // No checkout was started, so the reserved copies must go back on the shelf.
    await releaseStock(input.quantity).catch((releaseError) => {
      console.error('[checkout] could not release reserved stock', releaseError)
    })

    return NextResponse.json({ errors: { form: GENERIC_ERROR } }, { status: 500 })
  }
}

function soldOutMessage(available: number): string {
  if (available <= 0) return 'Kniha je momentálne vypredaná.'
  return `Máme už len ${available} ks. Znížte prosím počet kusov.`
}

function resolveBaseUrl(request: Request): string {
  if (process.env.NODE_ENV === 'production') return SITE_URL
  return new URL(request.url).origin
}
