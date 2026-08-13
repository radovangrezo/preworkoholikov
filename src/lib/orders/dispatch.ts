import { sendEmail } from '@/lib/email/client'
import { buildShippedEmail } from '@/lib/email/templates'
import { getPacketStatus } from '@/lib/packeta/client'
import {
  listOrdersAwaitingDispatch,
  markShippedEmailSent,
  markShippedOnce,
  savePacketStatus,
} from '@/lib/orders/repository'
import type { OrderRow } from '@/lib/orders/types'

const MAX_ORDERS_PER_RUN = 50

/**
 * Statuses that are a change from the baseline but do not mean the parcel is travelling.
 * Cancelling a packet moves it to statusCode 11 / codeText "cancelled", which would
 * otherwise be read as dispatch and send the customer an "on the way" email.
 */
const NON_DISPATCH_CODE_TEXTS = ['cancelled']

export type DispatchSyncReport = {
  checked: number
  shipped: number
  /** Observed Packeta statuses, so the real status values are visible in the logs. */
  statuses: { orderNumber: string; statusCode: string; statusText: string }[]
  /** Orders whose status changed to something that is not a dispatch. */
  notDispatched: { orderNumber: string; codeText: string }[]
  errors: string[]
}

/**
 * Asks Packeta about every paid order that already has a packet, and sends the
 * "on the way" email for the ones whose status moved on from the value recorded when
 * the packet was created — i.e. once you handed the parcel over.
 */
export async function syncDispatchedOrders(): Promise<DispatchSyncReport> {
  const report: DispatchSyncReport = {
    checked: 0,
    shipped: 0,
    statuses: [],
    notDispatched: [],
    errors: [],
  }
  const orders = await listOrdersAwaitingDispatch(MAX_ORDERS_PER_RUN)

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

async function syncOrder(order: OrderRow, report: DispatchSyncReport): Promise<void> {
  if (!order.packeta_packet_id) return

  const status = await getPacketStatus(order.packeta_packet_id)
  report.statuses.push({
    orderNumber: order.order_number,
    statusCode: status.statusCode,
    statusText: status.statusText,
  })

  // No baseline yet (the call at creation time failed): record one and wait.
  if (!order.packeta_status) {
    if (status.statusCode) await savePacketStatus(order.id, status.statusCode)
    return
  }

  if (!status.statusCode || status.statusCode === order.packeta_status) return

  // A cancelled packet is a status change, but the customer must not be told it shipped.
  // Record the new status so we stop re-examining it, and leave the order for a human.
  if (NON_DISPATCH_CODE_TEXTS.includes(status.codeText.toLowerCase())) {
    await savePacketStatus(order.id, status.statusCode)
    report.notDispatched.push({ orderNumber: order.order_number, codeText: status.codeText })
    return
  }

  const shipped = await markShippedOnce(order.id, status.statusCode)
  if (!shipped) return

  await sendEmail(buildShippedEmail(shipped))
  await markShippedEmailSent(shipped.id)
  report.shipped += 1
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
