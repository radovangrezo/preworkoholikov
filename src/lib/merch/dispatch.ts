import { sendEmail } from '@/lib/email/client'
import { buildMerchShippedEmail } from '@/lib/email/merch-templates'
import {
  listMerchOrdersAwaitingDispatch,
  markMerchShippedEmailSent,
  markMerchShippedOnce,
} from '@/lib/merch/repository'
import type { MerchOrderRow } from '@/lib/merch/types'
import { getOrder } from '@/lib/printful/client'

const MAX_ORDERS_PER_RUN = 50

/**
 * Printful statuses that mean the parcel has left. "partial" covers a multi-item order
 * where some items shipped first; the customer still wants to know it is moving.
 */
const SHIPPED_STATUSES = ['fulfilled', 'partial']

export type MerchDispatchReport = {
  checked: number
  shipped: number
  /** Observed Printful statuses, so real values are visible in the logs. */
  statuses: { orderNumber: string; status: string }[]
  errors: string[]
}

export async function syncShippedMerchOrders(): Promise<MerchDispatchReport> {
  const report: MerchDispatchReport = { checked: 0, shipped: 0, statuses: [], errors: [] }
  const orders = await listMerchOrdersAwaitingDispatch(MAX_ORDERS_PER_RUN)

  for (const order of orders) {
    try {
      await syncOrder(order, report)
    } catch (error) {
      report.errors.push(`${order.order_number}: ${describe(error)}`)
    }
    report.checked += 1
  }

  return report
}

async function syncOrder(order: MerchOrderRow, report: MerchDispatchReport): Promise<void> {
  if (!order.printful_order_id) return

  const status = await getOrder(order.printful_order_id)
  if (!status) return

  report.statuses.push({ orderNumber: order.order_number, status: status.status })

  if (!SHIPPED_STATUSES.includes(status.status.toLowerCase())) return

  const shipped = await markMerchShippedOnce(order.id, status.trackingUrl)
  if (!shipped) return

  await sendEmail(buildMerchShippedEmail(shipped))
  await markMerchShippedEmailSent(shipped.id)
  report.shipped += 1
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
