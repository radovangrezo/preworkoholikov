'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { SAMPLE_PAGES, SAMPLE_PAGE_SIZE } from '@/lib/sample/pages'
import { BOOK } from '@/lib/site'

const LAST_PAGE = SAMPLE_PAGES.length - 1

/**
 * A page is as tall as the screen allows, so the whole of it is read without scrolling and
 * the buttons underneath stay in view. On a narrow screen the width runs out first and the
 * page shrinks to fit it instead.
 */
const PAGE_CLASS =
  'mx-auto h-[70svh] w-auto max-w-full rounded bg-white shadow-[0_2px_16px_rgba(0,0,0,0.12)]'

const ARROW_CLASS =
  'flex h-11 w-11 items-center justify-center rounded-full bg-yellow text-xl text-white disabled:opacity-30'

/**
 * The sample read one page at a time: a strip of pages that snaps, so it is swiped on a
 * phone, scrolled on a trackpad, and stepped through with the buttons or the arrow keys.
 *
 * The pictures are generated at the width they are shown at, so they are served as they
 * are instead of being optimised a second time.
 */
export function BookSample() {
  const strip = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(0)

  /** Whichever page the strip has been scrolled to; snapping keeps it a whole one. */
  function pageInView(element: HTMLDivElement): number {
    return Math.round(element.scrollLeft / element.clientWidth)
  }

  /**
   * Turns a page. The strip is moved at once rather than smoothly, so the page it lands on
   * is known before the next click arrives and a quick reader never loses a turn.
   */
  function turn(by: number) {
    const element = strip.current
    if (!element) return

    const page = pageInView(element) + by
    element.scrollLeft = element.clientWidth * page
    setShown(page)
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        ref={strip}
        onScroll={(event) => setShown(pageInView(event.currentTarget))}
        tabIndex={0}
        role="region"
        aria-label={`Ukážka z knihy, ${SAMPLE_PAGES.length} strán`}
        className="flex w-full max-w-[576px] snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SAMPLE_PAGES.map((page) => (
          <div key={page.src} className="w-full shrink-0 snap-center px-2">
            <Image
              src={page.src}
              alt={`${BOOK.title} – strana ${page.number} z ukážky`}
              width={SAMPLE_PAGE_SIZE.width}
              height={SAMPLE_PAGE_SIZE.height}
              unoptimized
              className={PAGE_CLASS}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => turn(-1)}
          disabled={shown === 0}
          aria-label="Predchádzajúca strana"
          className={ARROW_CLASS}
        >
          <span aria-hidden>←</span>
        </button>
        <p className="text-base text-black tabular-nums">
          {shown + 1} / {SAMPLE_PAGES.length}
        </p>
        <button
          type="button"
          onClick={() => turn(1)}
          disabled={shown === LAST_PAGE}
          aria-label="Ďalšia strana"
          className={ARROW_CLASS}
        >
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  )
}
