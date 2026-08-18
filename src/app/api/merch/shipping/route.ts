import { NextResponse } from 'next/server'
import { MerchPricingError, priceCart } from '@/lib/merch/pricing'
import { validateMerchCheckout } from '@/lib/merch/validation'

export const runtime = 'nodejs'

/**
 * Quotes the live Printful shipping cost so the checkout form can show a real total
 * before the customer commits. The checkout route prices everything again, so nothing
 * here is trusted later.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Neplatný formát požiadavky.' }, { status: 400 })
  }

  // The quote needs a complete address, so the same validation applies.
  const validation = validateMerchCheckout(payload)
  if (!validation.ok) {
    return NextResponse.json({ incomplete: true }, { status: 200 })
  }

  const input = validation.data

  try {
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

    return NextResponse.json({
      subtotalCents: totals.subtotalCents,
      shippingCents: totals.shippingCents,
      totalCents: totals.totalCents,
      shippingRateId: totals.shippingRateId,
      shippingRateName: totals.shippingRateName,
      rates: totals.availableRates,
    })
  } catch (error) {
    if (error instanceof MerchPricingError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    console.error('[merch-shipping] could not quote shipping', error)
    return NextResponse.json({ error: 'Poštovné sa nepodarilo vypočítať.' }, { status: 500 })
  }
}
