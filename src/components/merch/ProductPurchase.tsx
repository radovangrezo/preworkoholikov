'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ProductGallery } from '@/components/merch/ProductGallery'
import { useCart } from '@/components/merch/useCart'
import { MAX_MERCH_ITEM_QUANTITY } from '@/lib/config/merch'
import { productImages } from '@/lib/merch/gallery'
import { formatEur } from '@/lib/money'
import type { PrintfulProduct, PrintfulVariant } from '@/lib/printful/types'
import { ROUTES } from '@/lib/site'

const SELECT_CLASS =
  'w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-black outline-none focus:border-yellow'
const LABEL_CLASS = 'block text-sm font-medium text-black mb-1'

export function ProductPurchase({ product }: { product: PrintfulProduct }) {
  const available = useMemo(
    () => product.variants.filter((variant) => variant.available),
    [product.variants],
  )

  const colors = useMemo(() => unique(available.map((v) => v.color)), [available])
  const [color, setColor] = useState<string | null>(colors[0] ?? null)

  const sizesForColor = useMemo(
    () => unique(available.filter((v) => v.color === color).map((v) => v.size)),
    [available, color],
  )
  const [size, setSize] = useState<string | null>(sizesForColor[0] ?? null)

  const selected = useMemo(
    () => pickVariant(available, color, size) ?? available[0] ?? null,
    [available, color, size],
  )

  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { add } = useCart()

  function changeColor(nextColor: string) {
    setColor(nextColor)
    // The chosen size may not exist in the new colour, so fall back to its first size.
    const nextSizes = unique(available.filter((v) => v.color === nextColor).map((v) => v.size))
    if (!nextSizes.includes(size)) setSize(nextSizes[0] ?? null)
    setAdded(false)
  }

  function handleAdd() {
    if (!selected) return
    add({
      syncVariantId: selected.syncVariantId,
      quantity,
      productId: product.id,
      name: selected.name,
      size: selected.size,
      color: selected.color,
      priceCents: selected.priceCents,
      imageUrl: selected.imageUrl,
    })
    setAdded(true)
  }

  const images = useMemo(() => productImages(product, selected), [product, selected])

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Keyed on the colour so the gallery reopens on that colour's own mockup. */}
      <ProductGallery key={color ?? ''} images={images} />

      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl md:text-[40px] font-bold leading-tight text-black">
            {product.name}
          </h1>
          {selected ? (
            <p className="mt-2 text-2xl font-bold text-black">{formatEur(selected.priceCents)}</p>
          ) : null}
        </div>

        {available.length === 0 ? (
          <p className="rounded-[20px] bg-white px-6 py-6 text-black">
            Tento produkt je momentálne nedostupný.
          </p>
        ) : (
          <>
            {colors.length > 1 ? (
              <div>
                <label className={LABEL_CLASS} htmlFor="color">
                  Farba
                </label>
                <select
                  id="color"
                  className={SELECT_CLASS}
                  value={color ?? ''}
                  onChange={(event) => changeColor(event.target.value)}
                >
                  {colors.map((option) => (
                    <option key={option ?? ''} value={option ?? ''}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {sizesForColor.length > 1 ? (
              <div>
                <label className={LABEL_CLASS} htmlFor="size">
                  Veľkosť
                </label>
                <select
                  id="size"
                  className={SELECT_CLASS}
                  value={size ?? ''}
                  onChange={(event) => {
                    setSize(event.target.value)
                    setAdded(false)
                  }}
                >
                  {sizesForColor.map((option) => (
                    <option key={option ?? ''} value={option ?? ''}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label className={LABEL_CLASS} htmlFor="quantity">
                Počet kusov
              </label>
              <select
                id="quantity"
                className={SELECT_CLASS}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              >
                {Array.from({ length: MAX_MERCH_ITEM_QUANTITY }, (_, i) => i + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!selected}
              className="rounded-full bg-yellow px-8 py-4 text-lg font-bold text-white disabled:opacity-60"
            >
              Pridať do košíka
            </button>

            {added ? (
              <Link
                href={ROUTES.merchCart}
                className="rounded-full bg-green px-8 py-4 text-center text-lg font-bold text-white no-underline"
              >
                Prejsť do košíka
              </Link>
            ) : null}
          </>
        )}

        {/* Outside the branch above, so it is still there when a product is unavailable. */}
        <Link
          href="/"
          className="rounded-full bg-grey px-8 py-4 text-center text-lg font-bold text-black no-underline"
        >
          Späť na hlavnú stránku
        </Link>
      </div>
    </div>
  )
}

function unique(values: (string | null)[]): (string | null)[] {
  return [...new Set(values)]
}

function pickVariant(
  variants: PrintfulVariant[],
  color: string | null,
  size: string | null,
): PrintfulVariant | null {
  return variants.find((v) => v.color === color && v.size === size) ?? null
}
