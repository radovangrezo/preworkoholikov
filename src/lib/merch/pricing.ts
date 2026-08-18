import { cheapestRate, getShippingRates, getVariant } from '@/lib/printful/client'
import type { PricedLine, PrintfulRecipient } from '@/lib/printful/types'
import type { CartLine, MerchTotals } from '@/lib/merch/types'

export class MerchPricingError extends Error {}

/**
 * Turns a browser cart into an authoritative price.
 *
 * Every line is re-read from Printful, so a tampered cart cannot change what is charged,
 * and shipping is quoted live for the real destination rather than guessed.
 */
export async function priceCart(
  lines: CartLine[],
  recipient: PrintfulRecipient,
  selectedRateId?: string | null,
): Promise<MerchTotals> {
  const priced: PricedLine[] = []

  for (const line of lines) {
    const variant = await getVariant(line.syncVariantId)

    if (!variant) {
      throw new MerchPricingError('Jedna z položiek v košíku už nie je dostupná.')
    }
    if (!variant.available) {
      throw new MerchPricingError(`Položka „${variant.name}" už nie je dostupná.`)
    }

    priced.push({
      syncVariantId: variant.syncVariantId,
      variantId: variant.variantId,
      name: variant.name,
      size: variant.size,
      color: variant.color,
      unitPriceCents: variant.priceCents,
      quantity: line.quantity,
      imageUrl: variant.imageUrl,
    })
  }

  const subtotalCents = priced.reduce(
    (total, item) => total + item.unitPriceCents * item.quantity,
    0,
  )

  const rates = await getShippingRates(
    recipient,
    priced.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
  )
  // The chosen id is only honoured if Printful just offered it for this exact basket and
  // address, so a tampered request cannot invent a cheaper shipping option.
  const chosen =
    (selectedRateId ? rates.find((rate) => rate.id === selectedRateId) : undefined) ??
    cheapestRate(rates)

  if (!chosen) {
    throw new MerchPricingError('Na túto adresu sa nám nepodarilo vypočítať poštovné.')
  }

  return {
    lines: priced,
    subtotalCents,
    shippingCents: chosen.rateCents,
    totalCents: subtotalCents + chosen.rateCents,
    shippingRateId: chosen.id,
    shippingRateName: chosen.name,
    availableRates: rates,
  }
}
