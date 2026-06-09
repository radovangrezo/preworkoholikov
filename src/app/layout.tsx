import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rozprávky pre workoholikov',
  description: 'Kniha Radovana Andreja Grežu – trpko-smiešne rozprávky o pracovnom živote.',
  icons: {
    icon: '/images/favico.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  )
}
