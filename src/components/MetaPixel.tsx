'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useRef } from 'react'
import { useConsent } from '@/components/useConsent'
import { META_PIXEL_ID, META_PIXEL_SCRIPT_SRC } from '@/lib/config/analytics'

const PIXEL_SCRIPT_ID = 'meta-pixel'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

/**
 * Loads the Meta Pixel once the visitor has allowed it, then reports every page view,
 * including client-side navigation. Renders nothing at all without consent.
 */
export function MetaPixel() {
  const { isGranted } = useConsent()
  const pathname = usePathname()
  const trackedPath = useRef<string | null>(null)

  useEffect(() => {
    if (!isGranted) return

    // The loader tracks the page it starts on, so the first path is already counted.
    if (trackedPath.current === null) {
      trackedPath.current = pathname
      return
    }
    if (trackedPath.current === pathname) return

    trackedPath.current = pathname
    window.fbq?.('track', 'PageView')
  }, [isGranted, pathname])

  if (!isGranted) return null

  return (
    <>
      <Script id={PIXEL_SCRIPT_ID} strategy="afterInteractive">
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
    </>
  )
}
