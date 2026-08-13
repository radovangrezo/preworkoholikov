import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckoutForm } from './CheckoutForm'
import { MAX_QUANTITY_PER_ORDER } from '@/lib/config/commerce'
import { getAvailableStock } from '@/lib/orders/repository'
import { BOOK } from '@/lib/site'

const CANCELLED_FLAG = 'zrusene'

/** Stock must be read fresh on every visit, never served from a cache. */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `Objednávka – ${BOOK.title}`,
  description: `Objednajte si knihu ${BOOK.title} priamo od autora.`,
  // A checkout page has nothing to offer search engines.
  robots: { index: false, follow: false },
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const wasCancelled = params[CANCELLED_FLAG] === '1'
  // If stock cannot be read, fall back to allowing the form: the API checks again
  // and is the authority, so a database hiccup should not close the shop.
  const available = await getAvailableStock().catch(() => MAX_QUANTITY_PER_ORDER)

  return (
    <main className="bg-cream min-h-screen px-5 py-10 md:py-12">
      <div className="mx-auto max-w-[760px]">
        <Link href="/" className="text-sm text-black underline">
          ← Späť na stránku knihy
        </Link>

        <h1 className="mt-6 text-3xl md:text-[40px] font-bold leading-tight text-black">
          Objednávka knihy
        </h1>
        <p className="mt-2 text-lg text-black">
          {BOOK.title} — {BOOK.priceDisplay} za kus
        </p>

        {wasCancelled && available > 0 ? (
          <p className="mt-6 rounded-[20px] bg-pink px-6 py-4 text-black">
            Platba bola zrušená. Objednávku môžete dokončiť nižšie.
          </p>
        ) : null}

        {available > 0 ? (
          <div className="mt-8">
            <CheckoutForm
              packetaApiKey={process.env.NEXT_PUBLIC_PACKETA_API_KEY ?? ''}
              maxQuantity={Math.min(MAX_QUANTITY_PER_ORDER, available)}
            />
          </div>
        ) : (
          <p className="mt-8 rounded-[20px] bg-white px-6 py-8 text-lg text-black">
            Kniha je momentálne vypredaná. Ďakujeme za záujem — ďalší dotlač pripravujeme.
          </p>
        )}
      </div>
    </main>
  )
}
