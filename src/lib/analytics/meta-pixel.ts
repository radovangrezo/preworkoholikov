'use client'

import type { MetaEventInput } from '@/lib/analytics/meta-events'
import {
  MAX_QUEUED_META_EVENTS,
  META_BASKET_EVENTS,
  META_CONTENT_TYPE,
  META_EVENT,
} from '@/lib/config/analytics'
import { CURRENCY } from '@/lib/config/commerce'
import { toAmount } from '@/lib/money'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

/**
 * Everything that speaks to the pixel goes through here.
 *
 * The pixel itself loads only once the visitor has allowed it, and even then `next/script`
 * adds it some time after the page turns interactive. An event raised before that waits in
 * the queue instead of being thrown away — a purchase must not go missing because the
 * loader was a tick late. A visitor who never agrees simply never has the queue sent.
 */
let isPixelReady = false
const pending: MetaEventInput[] = []
const sentEventIds = new Set<string>()

export function setPixelReady(ready: boolean): void {
  isPixelReady = ready
  if (ready) flush()
}

export function trackMetaEvent(event: MetaEventInput): void {
  pending.push(event)
  if (pending.length > MAX_QUEUED_META_EVENTS) pending.shift()
  flush()
}

/** Meta's loader reports the page it starts on; this covers client-side navigation. */
export function trackPageView(): void {
  if (!isPixelReady) return
  window.fbq?.('track', META_EVENT.pageView)
}

function flush(): void {
  if (!isPixelReady || !window.fbq) return
  for (const event of pending.splice(0)) send(event)
}

function send(event: MetaEventInput): void {
  if (event.eventId) {
    // Guards a second mount of the same page; Meta itself guards a later page load.
    if (sentEventIds.has(event.eventId)) return
    sentEventIds.add(event.eventId)
    window.fbq?.('track', event.name, parametersOf(event), { eventID: event.eventId })
    return
  }

  window.fbq?.('track', event.name, parametersOf(event))
}

function parametersOf(event: MetaEventInput): Record<string, unknown> {
  return {
    currency: CURRENCY,
    value: toAmount(event.valueCents),
    content_type: META_CONTENT_TYPE,
    content_ids: event.contents.map((content) => content.id),
    contents: event.contents,
    ...(event.contentName ? { content_name: event.contentName } : {}),
    ...(META_BASKET_EVENTS.includes(event.name)
      ? { num_items: event.contents.reduce((total, content) => total + content.quantity, 0) }
      : {}),
  }
}
