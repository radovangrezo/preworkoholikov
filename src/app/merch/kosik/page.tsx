import type { Metadata } from 'next'
import { CartCheckout } from '@/components/merch/CartCheckout'
import { BOOK } from '@/lib/site'

export const metadata: Metadata = {
  title: `Košík – ${BOOK.title}`,
  robots: { index: false, follow: false },
}

export default async function MerchCartPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  return (
    <main className="px-5 pb-12 md:px-8">
      <div className="mx-auto max-w-[760px]">
        <h1 className="text-3xl md:text-[40px] font-bold leading-tight text-black">Košík</h1>
        {params.zrusene === '1' ? (
          <p className="mt-6 rounded-[20px] bg-pink px-6 py-4 text-black">
            Platba bola zrušená. Objednávku môžete dokončiť nižšie.
          </p>
        ) : null}
        <CartCheckout />
      </div>
    </main>
  )
}
