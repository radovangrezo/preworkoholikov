'use client'

import { useEffect } from 'react'
import type { MetaEventInput } from '@/lib/analytics/meta-events'
import { trackMetaEvent } from '@/lib/analytics/meta-pixel'

/**
 * Reports one standard event from a page that renders on the server.
 *
 * The event is serialised into the dependency — the way the merch checkout keys its
 * shipping quote — so a re-render with an equal event cannot report it a second time.
 */
export function MetaEvent({ event }: { event: MetaEventInput }) {
  const eventKey = JSON.stringify(event)

  useEffect(() => {
    trackMetaEvent(JSON.parse(eventKey) as MetaEventInput)
  }, [eventKey])

  return null
}
