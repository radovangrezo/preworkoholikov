'use client'

import { useSyncExternalStore } from 'react'
import {
  denyConsent,
  getServerSnapshot,
  getSnapshot,
  grantConsent,
  resetConsent,
  subscribe,
} from '@/lib/consent/store'

export function useConsent() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return {
    state,
    isGranted: state === 'granted',
    /** True only once the browser has been read and no choice was stored. */
    needsChoice: state === 'unset',
    grant: grantConsent,
    deny: denyConsent,
    reset: resetConsent,
  }
}
