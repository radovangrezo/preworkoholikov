'use client'

import { useConsent } from '@/components/useConsent'

const STATUS_LABELS = {
  granted: 'Marketingové cookies máte povolené.',
  denied: 'Marketingové cookies máte odmietnuté.',
  unset: 'Zatiaľ ste sa nerozhodli. Vyberte si v lište v dolnej časti stránky.',
}

/** Lets the visitor take back or change a choice as easily as they made it. */
export function CookieSettings() {
  const { state, reset } = useConsent()

  // 'unread' means the browser has not been read yet; showing a status would guess.
  if (state === 'unread') return null

  return (
    <div className="flex flex-col items-start gap-3">
      <p>{STATUS_LABELS[state]}</p>
      {state === 'unset' ? null : (
        <button
          type="button"
          onClick={reset}
          className="rounded-full border-2 border-black px-5 py-2 text-sm font-bold text-black"
        >
          Zmeniť voľbu
        </button>
      )}
    </div>
  )
}
