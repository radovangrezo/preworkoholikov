import Image from 'next/image'
import Link from 'next/link'
import { formatEur } from '@/lib/money'
import type { PrintfulProductListing } from '@/lib/printful/types'
import { merchProductPath } from '@/lib/site'

/**
 * One product card, shared by the landing page and /merch.
 *
 * The image and the button are separate links rather than one link wrapping a button:
 * nesting interactive elements is invalid HTML and confuses screen readers. Both lead to
 * the product page, because most items need a size or colour chosen before they can be
 * added to a basket.
 */
export function MerchCard({ product }: { product: PrintfulProductListing }) {
  const href = merchProductPath(product.id)

  return (
    <div className="flex flex-col overflow-hidden rounded-[20px] bg-white">
      <Link href={href} className="group no-underline">
        <div className="aspect-square overflow-hidden bg-cream">
          <Image
            src={product.thumbnailUrl}
            alt={product.name}
            width={600}
            height={600}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        </div>
        <div className="flex flex-col gap-1 px-5 pt-5">
          <h3 className="text-lg font-bold text-black">{product.name}</h3>
          {product.fromPriceCents !== null ? (
            <p className="text-black">
              {product.variantCount > 1 ? 'od ' : ''}
              <span className="font-bold">{formatEur(product.fromPriceCents)}</span>
            </p>
          ) : (
            <p className="text-black/60">Momentálne nedostupné</p>
          )}
        </div>
      </Link>

      <div className="mt-auto p-5">
        <Link
          href={href}
          className="block rounded-full bg-yellow px-6 py-3 text-center text-lg font-bold text-white no-underline"
        >
          Kúpiť
        </Link>
      </div>
    </div>
  )
}
