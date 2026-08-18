'use client'

import { useSyncExternalStore } from 'react'
import {
  addLine,
  clearCart,
  getServerSnapshot,
  getSnapshot,
  removeLine,
  setQuantity,
  subscribe,
} from '@/lib/merch/cart-store'
import type { CartLineDisplay } from '@/lib/merch/types'

export function useCart() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return {
    lines,
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    /** Indicative only — the server re-prices everything at checkout. */
    subtotalCents: lines.reduce((total, line) => total + line.priceCents * line.quantity, 0),
    add: addLine,
    setQuantity,
    remove: removeLine,
    clear: clearCart,
  }
}

export type { CartLineDisplay }
