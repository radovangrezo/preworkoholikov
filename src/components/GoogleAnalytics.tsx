'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { useConsent } from '@/components/useConsent'
import {
  GA_CONSENT_WAIT_MS,
  GA_MEASUREMENT_ID,
  gaConsentPayload,
  gaScriptSrc,
} from '@/lib/config/analytics'

const GA_CONFIG_SCRIPT_ID = 'google-analytics'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const DEFAULT_CONSENT = JSON.stringify({
  ...gaConsentPayload('denied'),
  wait_for_update: GA_CONSENT_WAIT_MS,
})

/**
 * Google Analytics under Consent Mode v2.
 *
 * Unlike the Meta Pixel, this loads for every visitor. It has to: a tag that appears only
 * after someone clicks "accept" is invisible to Google's own tag checker. What consent
 * controls here is what the tag may do — it starts with every storage signal denied, so
 * nothing is written to the device and no identifier is created until the visitor agrees.
 *
 * Client-side navigation needs no help: GA4's enhanced measurement watches the History API,
 * which is how the App Router moves between pages.
 */
export function GoogleAnalytics() {
  const { isGranted } = useConsent()
  const [isLoaderReady, setIsLoaderReady] = useState(false)

  // Waits for the loader, so the update can never be pushed ahead of the default it revises.
  useEffect(() => {
    if (!isLoaderReady || !isGranted) return
    window.gtag?.('consent', 'update', gaConsentPayload('granted'))
  }, [isLoaderReady, isGranted])

  return (
    <>
      <Script
        id={GA_CONFIG_SCRIPT_ID}
        strategy="afterInteractive"
        onReady={() => setIsLoaderReady(true)}
      >
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', ${DEFAULT_CONSENT});
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
      <Script src={gaScriptSrc(GA_MEASUREMENT_ID)} strategy="afterInteractive" />
    </>
  )
}
