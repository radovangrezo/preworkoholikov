'use client'

/**
 * Whether the visitor lets us load marketing cookies.
 *
 * 'unread' is what the server and the first hydration pass see: the choice lives in
 * localStorage, so until the browser has been read we must assume nothing and load
 * nothing. Keeping it as a real state stops the banner from flashing at visitors who
 * already decided.
 */
export const CONSENT_STATES = ['unread', 'unset', 'granted', 'denied'] as const
export type ConsentState = (typeof CONSENT_STATES)[number]

const STORAGE_KEY = 'rpw-cookie-consent'

/**
 * Mirrors the cart store: a cached snapshot, because React compares snapshots by
 * identity and re-reading localStorage on every render would never settle.
 */
let snapshot: ConsentState = 'unread'
let loaded = false
const listeners = new Set<() => void>()

function load(): void {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    snapshot = sanitize(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    // Storage can be blocked entirely; treat that as "not decided yet".
    snapshot = 'unset'
  }
}

/** The stored value is user-editable, so anything unrecognised means "not decided yet". */
function sanitize(value: string | null): ConsentState {
  return value === 'granted' || value === 'denied' ? value : 'unset'
}

function commit(next: ConsentState): void {
  loaded = true
  snapshot = next
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // A full or blocked storage should not break the page.
  }
  for (const listener of listeners) listener()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot(): ConsentState {
  load()
  return snapshot
}

/** The server cannot know the choice, and nothing may load until the client reports it. */
export function getServerSnapshot(): ConsentState {
  return 'unread'
}

export function grantConsent(): void {
  commit('granted')
}

export function denyConsent(): void {
  commit('denied')
}

/** Withdrawing consent has to be as easy as giving it, so the banner can be brought back. */
export function resetConsent(): void {
  commit('unset')
}
