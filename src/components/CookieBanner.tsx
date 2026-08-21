'use client'

import Link from 'next/link'
import { useConsent } from '@/components/useConsent'
import { ROUTES } from '@/lib/site'

/** Asks before anything is tracked. Nothing loads until the visitor answers. */
export function CookieBanner() {
  const { needsChoice, grant, deny } = useConsent()

  if (!needsChoice) return null

  return (
    <div
      role="dialog"
      aria-label="Súhlas so súbormi cookie"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4"
    >
      <div className="mx-auto flex max-w-[760px] flex-col gap-4 rounded-[20px] bg-white p-5 shadow-lg md:p-6">
        <div className="flex flex-col gap-2 text-black">
          <h2 className="text-lg font-bold">Súbory cookie</h2>
          <p className="text-sm leading-relaxed">
            Na meranie návštevnosti a účinnosti našej reklamy používame Google Analytics a Meta
            Pixel. Bez vášho súhlasu neukladáme do vášho zariadenia žiadne súbory cookie, Meta
            Pixel vôbec nenačítame a Google Analytics beží bez identifikátorov. Viac v{' '}
            <Link href={ROUTES.privacy} className="underline">
              ochrane osobných údajov
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={grant}
            className="rounded-full bg-yellow px-6 py-3 text-base font-bold text-white"
          >
            Povoliť
          </button>
          <button
            type="button"
            onClick={deny}
            className="rounded-full border-2 border-black px-6 py-3 text-base font-bold text-black"
          >
            Odmietnuť
          </button>
        </div>
      </div>
    </div>
  )
}
