import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductPurchase } from '@/components/merch/ProductPurchase'
import { getProduct } from '@/lib/printful/client'
import { BOOK } from '@/lib/site'

// Next only accepts a literal here, so it cannot read MERCH_CACHE_SECONDS. Keep in step.
export const revalidate = 3600

type PageProps = { params: Promise<{ id: string }> }

async function loadProduct(params: PageProps['params']) {
  const { id } = await params
  const productId = Number(id)
  if (!Number.isInteger(productId) || productId <= 0) return null
  return getProduct(productId)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await loadProduct(params)
  if (!product) return { title: `Merch – ${BOOK.title}` }

  return {
    title: `${product.name} – ${BOOK.title}`,
    description: `${product.name} z kolekcie ${BOOK.title}.`,
  }
}

export default async function MerchProductPage({ params }: PageProps) {
  const product = await loadProduct(params)
  if (!product) notFound()

  return (
    <main className="px-5 pb-12 md:px-8">
      <div className="mx-auto max-w-[1100px]">
        <ProductPurchase product={product} />
      </div>
    </main>
  )
}
