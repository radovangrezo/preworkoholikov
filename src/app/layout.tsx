import type { Metadata } from 'next'
import { CookieBanner } from '@/components/CookieBanner'
import { MetaPixel } from '@/components/MetaPixel'
import { BOOK, OG_IMAGE, SITE_URL } from '@/lib/site'
import './globals.css'

const PAGE_TITLE = `${BOOK.title} – kniha od ${BOOK.authorGenitive}`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: PAGE_TITLE,
  description: BOOK.description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: PAGE_TITLE,
    description: BOOK.description,
    url: SITE_URL,
    siteName: BOOK.title,
    locale: 'sk_SK',
    type: 'website',
    images: [
      {
        url: OG_IMAGE.path,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: BOOK.title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: BOOK.description,
    images: [OG_IMAGE.path],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={BOOK.language}>
      <body>
        {children}
        <MetaPixel />
        <CookieBanner />
      </body>
    </html>
  )
}
