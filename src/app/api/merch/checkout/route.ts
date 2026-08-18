import { NextResponse } from 'next/server'
import { MerchPricingError, priceCart } from '@/lib/merch/pricing'
import { attachMerchStripeSession, createPendingMerchOrder } from '@/lib/merch/repository'
import { validateMerchCheckout } from '@/lib/merch/validation'
import { SITE_URL } from '@/lib/site'
import { createMerchCheckoutSession } from '@/lib/stripe/merch-checkout'

export const runtime = 'nodejs'

const GENERIC_ERROR = 'Objednávku sa nepodarilo vytvoriť. Skúste to prosím znova.'

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ errors: { form: 'Neplatný formát požiadavky.' } }, { status: 400 })
  }

  const validation = validateMerchCheckout(payload)
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 })
  }

  const input = validation.data

  try {
    // Prices and shipping come from Printful, never from the browser's cart.
    const totals = await priceCart(
      input.lines,
      {
        name: `${input.name} ${input.surname}`,
        address1: input.address1,
        city: input.city,
        countryCode: input.countryCode,
        zip: input.zip,
      },
      input.shippingRateId,
    )

    const order = await createPendingMerchOrder(input, totals)
    const session = await createMerchCheckoutSession({
      order,
      totals,
      baseUrl: resolveBaseUrl(request),
    })
    await attachMerchStripeSession(order.id, session.id)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof MerchPricingError) {
      return NextResponse.json({ errors: { form: error.message } }, { status: 409 })
    }

    console.error('[merch-checkout] could not start payment', error)
    return NextResponse.json({ errors: { form: GENERIC_ERROR } }, { status: 500 })
  }
}

function resolveBaseUrl(request: Request): string {
  if (process.env.NODE_ENV === 'production') return SITE_URL
  return new URL(request.url).origin
}
