import { sendEmail } from '@/lib/email/client'
import { buildOrderConfirmationEmail } from '@/lib/email/templates'
import { createPacket, getPacketStatus } from '@/lib/packeta/client'
import { buildPacketAttributes } from '@/lib/packeta/packet'
import {
  getOrderItems,
  markConfirmationEmailSent,
  savePacketError,
  savePacketResult,
  savePacketStatus,
} from '@/lib/orders/repository'
import type { OrderRow } from '@/lib/orders/types'

export type FulfillmentOutcome = {
  packetCreated: boolean
  confirmationEmailSent: boolean
  errors: string[]
}

/**
 * Everything that happens once money has arrived: register the packet with Packeta so
 * it shows up in the client zone ready for a label, and confirm by email.
 *
 * Each step is isolated. The order is already paid at this point, so a Packeta outage
 * must not cost us the confirmation email, and neither failure may bubble up and make
 * Stripe think the webhook failed. Failures are recorded instead.
 */
export async function fulfillPaidOrder(order: OrderRow): Promise<FulfillmentOutcome> {
  const outcome: FulfillmentOutcome = {
    packetCreated: false,
    confirmationEmailSent: false,
    errors: [],
  }

  let enrichedOrder = order

  try {
    const packet = await createPacket(buildPacketAttributes(order))
    await savePacketResult(order.id, packet)
    enrichedOrder = {
      ...order,
      packeta_packet_id: packet.packetId,
      packeta_barcode: packet.barcode,
    }
    outcome.packetCreated = true

    await recordStatusBaseline(order.id, packet.packetId, outcome)
  } catch (error) {
    const message = describe(error)
    outcome.errors.push(`packeta: ${message}`)
    await savePacketError(order.id, message).catch(() => {})
  }

  try {
    const items = await getOrderItems(order.id)
    await sendEmail(buildOrderConfirmationEmail(enrichedOrder, items))
    await markConfirmationEmailSent(order.id)
    outcome.confirmationEmailSent = true
  } catch (error) {
    outcome.errors.push(`email: ${describe(error)}`)
  }

  return outcome
}

/**
 * Stores the status a freshly created packet starts at. Dispatch is later detected as
 * a change from this value, which avoids depending on Packeta's numeric status codes.
 * If this fails the order simply never auto-ships, which is the safe direction.
 */
async function recordStatusBaseline(
  orderId: string,
  packetId: string,
  outcome: FulfillmentOutcome,
): Promise<void> {
  try {
    const status = await getPacketStatus(packetId)
    if (status.statusCode) {
      await savePacketStatus(orderId, status.statusCode)
    }
  } catch (error) {
    outcome.errors.push(`packeta status baseline: ${describe(error)}`)
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
