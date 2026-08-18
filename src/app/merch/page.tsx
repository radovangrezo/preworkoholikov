import type { Metadata } from 'next'
import { MerchCard } from '@/components/merch/MerchCard'
import { listProductsWithPrices } from '@/lib/printful/client'
import type { PrintfulProductListing } from '@/lib/printful/types'
import { BOOK } from '@/lib/site'

const TITLE = 'Merch'

export const metadata: Metadata = {
  title: `${TITLE} – ${BOOK.title}`,
  description: `Tričká, hrnčeky a ďalšie veci pre workoholikov.`,
}

// Next only accepts a literal here, so it cannot read MERCH_CACHE_SECONDS. Keep in step.
export const revalidate = 3600

export default async function MerchPage() {
  // A Printful outage, an expired token or a missing key must not fail the build or take
  // the site down: the page falls back to its empty state and recovers on the next
  // revalidation. This page is prerendered, so an unguarded throw here breaks deployment.
  let products: PrintfulProductListing[] = []

  try {
    products = await listProductsWithPrices()
  } catch (error) {
    console.error('[merch] could not load products', error)
  }

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
