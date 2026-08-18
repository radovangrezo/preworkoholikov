import type { Metadata } from 'next'
import { MerchCard } from '@/components/merch/MerchCard'
import { listProductsWithPrices } from '@/lib/printful/client'
import { BOOK } from '@/lib/site'

const TITLE = 'Merch'

export const metadata: Metadata = {
  title: `${TITLE} – ${BOOK.title}`,
  description: `Tričká, hrnčeky a ďalšie veci pre workoholikov.`,
}

// Next only accepts a literal here, so it cannot read MERCH_CACHE_SECONDS. Keep in step.
export const revalidate = 3600

export default async function MerchPage() {
  const products = await listProductsWithPrices()

  return (
    <main className="px-5 pb-12 md:px-8">
      <div className="mx-auto max-w-[1100px]">
        <h1 className="text-3xl md:text-[40px] font-bold leading-tight text-black">{TITLE}</h1>
        <p className="mt-2 text-lg text-black">
          Veci pre tých, čo to s prácou preháňajú. Každý kus tlačíme na objednávku.
        </p>

        {products.length === 0 ? (
          <p className="mt-8 rounded-[20px] bg-white px-6 py-8 text-lg text-black">
            Merch práve pripravujeme. Skúste to prosím neskôr.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <MerchCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
