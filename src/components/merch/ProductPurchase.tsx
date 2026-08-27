'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ProductGallery } from '@/components/merch/ProductGallery'
import { useCart } from '@/components/merch/useCart'
import { MAX_MERCH_ITEM_QUANTITY } from '@/lib/config/merch'
import { productImages } from '@/lib/merch/gallery'
import { inMillilitres, isVolume } from '@/lib/merch/sizes'
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

  /**
   * The size of each piece being bought, so somebody buying three t-shirts can take one
   * of each size. Its length is the quantity, and a product sold in one size holds a
   * single null entry — which keeps one code path for everything in the shop.
   */
  const [sizes, setSizes] = useState<(string | null)[]>([sizesForColor[0] ?? null])

  /**
   * The one capacity a mug is made in. There is nothing to choose, but a shopper still
   * wants to know how big the mug is — whereas the single size of a tote or a notebook
   * ("One size") tells them nothing, so only capacities are stated.
   */
  const soleVolume = useMemo(() => {
    const [only] = sizesForColor
    if (sizesForColor.length !== 1 || !only || !isVolume(only)) return null
    return inMillilitres(only)
  }, [sizesForColor])

  const chosen = useMemo(
    () =>
      sizes
        .map((size) => pickVariant(available, color, size) ?? available[0] ?? null)
        .filter((variant): variant is PrintfulVariant => variant !== null),
    [available, color, sizes],
  )

  const selected = chosen[0] ?? null
  const [added, setAdded] = useState(false)
  const { add } = useCart()

  function changeColor(nextColor: string) {
    setColor(nextColor)
    // A colour need not come in the same sizes, so anything it lacks falls back.
    const nextSizes = unique(available.filter((v) => v.color === nextColor).map((v) => v.size))
    setSizes((current) =>
      current.map((size) => (nextSizes.includes(size) ? size : (nextSizes[0] ?? null))),
    )
    setAdded(false)
  }

  function changeQuantity(quantity: number) {
    setSizes((current) =>
      quantity <= current.length
        ? current.slice(0, quantity)
        : // A piece added to the order repeats the size chosen last, which is the
          // common case and saves changing every dropdown.
          [
            ...current,
            ...Array<string | null>(quantity - current.length).fill(current.at(-1) ?? null),
          ],
    )
    setAdded(false)
  }

  function changeSize(index: number, size: string) {
    setSizes((current) => current.map((current, at) => (at === index ? size : current)))
    setAdded(false)
  }

  function handleAdd() {
    // The cart is keyed by variant, so pieces that share a size become one line.
    const lines = new Map<number, { variant: PrintfulVariant; quantity: number }>()

    for (const variant of chosen) {
      const line = lines.get(variant.syncVariantId)
      if (line) line.quantity += 1
      else lines.set(variant.syncVariantId, { variant, quantity: 1 })
    }

    for (const { variant, quantity } of lines.values()) {
      add({
        syncVariantId: variant.syncVariantId,
        quantity,
        productId: product.id,
        name: variant.name,
        size: variant.size,
        color: variant.color,
        priceCents: variant.priceCents,
        imageUrl: variant.imageUrl,
      })
    }

    setAdded(lines.size > 0)
  }

  const images = useMemo(() => productImages(product, selected), [product, selected])

  // Sizes of one product can differ in price, and mixing them makes no single unit price
  // true, so the cheapest is quoted the way the product cards do it.
  const prices = chosen.map((variant) => variant.priceCents)
  const oneUnitPrice = prices.every((price) => price === prices[0])

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
            <p className="mt-2 text-2xl font-bold text-black">
              {oneUnitPrice ? '' : 'od '}
              {formatEur(Math.min(...prices))}
            </p>
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

            {/* Above the sizes, because the count decides how many of them there are. */}
            <div>
              <label className={LABEL_CLASS} htmlFor="quantity">
                Počet kusov
              </label>
              <select
                id="quantity"
                className={SELECT_CLASS}
                value={sizes.length}
                onChange={(event) => changeQuantity(Number(event.target.value))}
              >
                {Array.from({ length: MAX_MERCH_ITEM_QUANTITY }, (_, i) => i + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {sizesForColor.length > 1
              ? sizes.map((size, index) => (
                  <div key={index}>
                    <label className={LABEL_CLASS} htmlFor={`size-${index}`}>
                      {sizes.length > 1 ? `Veľkosť – ${index + 1}. kus` : 'Veľkosť'}
                    </label>
                    <select
                      id={`size-${index}`}
                      className={SELECT_CLASS}
                      value={size ?? ''}
                      onChange={(event) => changeSize(index, event.target.value)}
                    >
                      {sizesForColor.map((option) => (
                        <option key={option ?? ''} value={option ?? ''}>
                          {inMillilitres(option ?? '')}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              : null}

            {soleVolume ? (
              <div>
                <span className={LABEL_CLASS}>Veľkosť</span>
                <p className="text-base text-black">{soleVolume}</p>
              </div>
            ) : null}

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
