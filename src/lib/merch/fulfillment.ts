import { sendEmail } from '@/lib/email/client'
import { buildMerchConfirmationEmail } from '@/lib/email/merch-templates'
import {
  getMerchOrderItems,
  markMerchConfirmationSent,
  saveMerchPrintfulError,
  saveMerchPrintfulResult,
} from '@/lib/merch/repository'
import type { MerchOrderRow } from '@/lib/merch/types'
import { createOrder } from '@/lib/printful/client'

/** Send straight to production rather than leaving drafts to approve by hand. */
const CONFIRM_ORDERS = true

export type MerchFulfillmentOutcome = {
  printfulOrderCreated: boolean
  confirmationEmailSent: boolean
  errors: string[]
}

/**
 * Everything that happens once a merch order is paid: hand it to Printful for printing
 * and shipping, then confirm by email.
 *
 * As with book orders, each step is isolated and failures are recorded rather than thrown.
 * The customer has already paid, so a Printful outage must not cost us the confirmation
 * email, and neither failure may make Stripe think the webhook failed.
 */
export async function fulfillPaidMerchOrder(
  order: MerchOrderRow,
): Promise<MerchFulfillmentOutcome> {
  const outcome: MerchFulfillmentOutcome = {
    printfulOrderCreated: false,
    confirmationEmailSent: false,
    errors: [],
  }

  const items = await getMerchOrderItems(order.id)

  try {
    const created = await createOrder({
      // Our order number, so a Printful order can always be traced back here.
      externalId: order.order_number,
      recipient: {
        name: `${order.customer_name} ${order.customer_surname}`,
        address1: order.address1,
        city: order.city,
        countryCode: order.country_code,
        zip: order.zip,
        email: order.email,
        ...(order.phone ? { phone: order.phone } : {}),
      },
      items: items.map((item) => ({
        syncVariantId: item.sync_variant_id,
        quantity: item.quantity,
      })),
      confirm: CONFIRM_ORDERS,
    })

    await saveMerchPrintfulResult(order.id, String(created.printfulOrderId))
    outcome.printfulOrderCreated = true
  } catch (error) {
    const message = describe(error)
    outcome.errors.push(`printful: ${message}`)
    await saveMerchPrintfulError(order.id, message).catch(() => {})
  }

  try {
    await sendEmail(buildMerchConfirmationEmail(order, items))
    await markMerchConfirmationSent(order.id)
    outcome.confirmationEmailSent = true
  } catch (error) {
    outcome.errors.push(`email: ${describe(error)}`)
  }

  return outcome
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
