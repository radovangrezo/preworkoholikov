'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useRef } from 'react'
import { useConsent } from '@/components/useConsent'
import { setPixelReady, trackPageView } from '@/lib/analytics/meta-pixel'
import { META_PIXEL_ID, META_PIXEL_SCRIPT_SRC } from '@/lib/config/analytics'

const PIXEL_SCRIPT_ID = 'meta-pixel'

/**
 * Loads the Meta Pixel once the visitor has allowed it, then reports every page view,
 * including client-side navigation. Renders nothing at all without consent.
 *
 * Conversion events are raised by the pages that know about them and reach the pixel
 * through the queue in lib/analytics/meta-pixel, which is why this tells the queue when
 * the loader has run.
 */
export function MetaPixel() {
  const { isGranted } = useConsent()
  const pathname = usePathname()
  const trackedPath = useRef<string | null>(null)

  // Consent can be withdrawn, and the loader goes with it: anything raised from then on
  // waits again rather than being reported to a pixel that is no longer there.
  useEffect(() => {
    if (!isGranted) setPixelReady(false)
  }, [isGranted])

  useEffect(() => {
    if (!isGranted) return

    // The loader tracks the page it starts on, so the first path is already counted.
    if (trackedPath.current === null) {
      trackedPath.current = pathname
      return
    }
    if (trackedPath.current === pathname) return

    trackedPath.current = pathname
    trackPageView()
  }, [isGranted, pathname])

  if (!isGranted) return null

  return (
    <Script id={PIXEL_SCRIPT_ID} strategy="afterInteractive" onReady={() => setPixelReady(true)}>
      {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'${META_PIXEL_SCRIPT_SRC}');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
    </Script>
  )
}
