import type { MetaEventName } from '@/lib/config/analytics'
import { toAmount } from '@/lib/money'

/**
 * The shape of a Meta conversion event, kept free of browser code so that a
 * server-rendered page can describe an event and hand it to the client component that
 * reports it.
 */

/** One buyable item inside an event, in Meta's vocabulary. */
export type MetaContent = {
  id: string
  quantity: number
  item_price: number
}

export type MetaEventInput = {
  name: MetaEventName
  contents: MetaContent[]
  /** What the event is worth, in cents. An order total also carries the shipping. */
  valueCents: number
  contentName?: string
  /**
   * Meta discards a repeat of an id it has already seen, so an order that carries one
   * counts a single time however often its page is opened.
   */
  eventId?: string
}

/** Describes one item. The id is whatever the shop sells: a book SKU, a Printful variant. */
export function metaContent(
  id: string | number,
  quantity: number,
  unitPriceCents: number,
): MetaContent {
  return { id: String(id), quantity, item_price: toAmount(unitPriceCents) }
}
