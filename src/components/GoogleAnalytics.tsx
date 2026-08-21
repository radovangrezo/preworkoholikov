'use client'

import Script from 'next/script'
import { useConsent } from '@/components/useConsent'
import { GA_MEASUREMENT_ID, gaScriptSrc } from '@/lib/config/analytics'

const GA_CONFIG_SCRIPT_ID = 'google-analytics'

/**
 * Loads Google Analytics once the visitor has allowed it, and nothing at all before then.
 *
 * Client-side navigation needs no help here, unlike the Meta Pixel: GA4's enhanced
 * measurement watches the History API, which is how the App Router moves between pages.
 * Sending page views from a route effect as well would count every navigation twice.
 */
export function GoogleAnalytics() {
  const { isGranted } = useConsent()

  if (!isGranted) return null

  return (
    <>
      <Script src={gaScriptSrc(GA_MEASUREMENT_ID)} strategy="afterInteractive" />
      <Script id={GA_CONFIG_SCRIPT_ID} strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  )
}
