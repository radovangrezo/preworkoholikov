'use client'

import { MAX_MERCH_CART_LINES, MAX_MERCH_ITEM_QUANTITY } from '@/lib/config/merch'
import type { CartLineDisplay } from '@/lib/merch/types'

const STORAGE_KEY = 'rpw-merch-cart'

/**
 * The cart lives in localStorage so it survives a reload and the trip to Stripe.
 *
 * A snapshot is cached in memory because React's external-store subscription compares
 * snapshots by identity: parsing localStorage on every read would return a new array each
 * time and spin forever.
 */
let snapshot: CartLineDisplay[] = []
let loaded = false
const listeners = new Set<() => void>()

const EMPTY: CartLineDisplay[] = []

function load(): void {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    snapshot = raw ? sanitize(JSON.parse(raw)) : []
  } catch {
    snapshot = []
  }
}

/** The stored cart is user-editable, so it is re-checked on the way in. */
function sanitize(value: unknown): CartLineDisplay[] {
  if (!Array.isArray(value)) return []

  const lines: CartLineDisplay[] = []
  for (const entry of value.slice(0, MAX_MERCH_CART_LINES)) {
    if (typeof entry !== 'object' || entry === null) continue
    const line = entry as Record<string, unknown>
    const syncVariantId = Number(line.syncVariantId)
    const quantity = Number(line.quantity)
    if (!Number.isInteger(syncVariantId) || syncVariantId <= 0) continue
    if (!Number.isInteger(quantity) || quantity < 1) continue

    lines.push({
      syncVariantId,
      quantity: Math.min(quantity, MAX_MERCH_ITEM_QUANTITY),
      productId: Number(line.productId) || 0,
      name: String(line.name ?? ''),
      size: line.size == null ? null : String(line.size),
      color: line.color == null ? null : String(line.color),
      priceCents: Number(line.priceCents) || 0,
      imageUrl: line.imageUrl == null ? null : String(line.imageUrl),
    })
  }

  return lines
}

function commit(next: CartLineDisplay[]): void {
  snapshot = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // A full or blocked storage should not break the page.
  }
  for (const listener of listeners) listener()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot(): CartLineDisplay[] {
  load()
  return snapshot
}

/** The server has no cart; rendering an empty one avoids a hydration mismatch. */
export function getServerSnapshot(): CartLineDisplay[] {
  return EMPTY
}

export function addLine(line: CartLineDisplay): void {
  load()
  const existing = snapshot.find((entry) => entry.syncVariantId === line.syncVariantId)

  if (existing) {
    commit(
      snapshot.map((entry) =>
        entry.syncVariantId === line.syncVariantId
          ? { ...entry, quantity: Math.min(entry.quantity + line.quantity, MAX_MERCH_ITEM_QUANTITY) }
          : entry,
      ),
    )
    return
  }

  if (snapshot.length >= MAX_MERCH_CART_LINES) return
  commit([...snapshot, line])
}

export function setQuantity(syncVariantId: number, quantity: number): void {
  load()
  if (quantity < 1) {
    removeLine(syncVariantId)
    return
  }
  commit(
    snapshot.map((entry) =>
      entry.syncVariantId === syncVariantId
        ? { ...entry, quantity: Math.min(quantity, MAX_MERCH_ITEM_QUANTITY) }
        : entry,
    ),
  )
}

export function removeLine(syncVariantId: number): void {
  load()
  commit(snapshot.filter((entry) => entry.syncVariantId !== syncVariantId))
}

export function clearCart(): void {
  load()
  commit([])
}
