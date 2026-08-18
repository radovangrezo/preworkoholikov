import Link from 'next/link'
import { CartBadge } from '@/components/merch/CartBadge'
import { ROUTES } from '@/lib/site'

export default function MerchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cream min-h-screen">
      <header className="flex items-center justify-between gap-4 px-5 py-5 md:px-8">
        <Link href="/" className="text-sm text-black underline">
          ← Späť na stránku knihy
        </Link>
        <nav className="flex items-center gap-5">
          <Link href={ROUTES.merch} className="text-sm font-medium text-black underline">
            Merch
          </Link>
          <CartBadge />
        </nav>
      </header>
      {children}
    </div>
  )
}
