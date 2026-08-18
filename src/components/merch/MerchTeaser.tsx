import Link from 'next/link'
import { MerchCard } from '@/components/merch/MerchCard'
import { listProductsWithPrices } from '@/lib/printful/client'
import type { PrintfulProductListing } from '@/lib/printful/types'
import { ROUTES } from '@/lib/site'

/**
 * The full merch range on the landing page. Printful is cached and, if it is unreachable,
 * the section simply does not render — a merch outage must never take down the book's page.
 */
export async function MerchTeaser() {
  let products: PrintfulProductListing[] = []

  try {
    products = await listProductsWithPrices()
  } catch (error) {
    console.error('[merch-teaser] could not load products', error)
    return null
  }

  if (products.length === 0) return null

  return (
    <section id="merch" className="bg-[#f7f3ed] py-10 md:py-12 px-5">
      <div className="mx-auto max-w-[1366px]">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl md:text-[32px] font-bold text-black">Merch</h2>
          <Link href={ROUTES.merch} className="text-black underline">
            Otvoriť merch
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <MerchCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
