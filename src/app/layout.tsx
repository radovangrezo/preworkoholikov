import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rozprávky pre workoholikov',
  description: '42 príbehov o sebaklamoch, ktoré si nahovárame, aby sme v kancelárii nevyskočili z okna',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  )
}
