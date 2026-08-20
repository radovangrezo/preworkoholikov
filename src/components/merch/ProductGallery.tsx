'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { ProductImage } from '@/lib/merch/gallery'

const MAIN_SIZE = 900
const THUMBNAIL_SIZE = 220

/**
 * The product's pictures, with thumbnails to switch between them. With a single picture
 * it renders exactly what the page showed before the gallery existed.
 *
 * The thumbnails repeat images that are already on the page, so they are labelled for
 * screen readers on the button and left out of the picture itself.
 */
export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [shown, setShown] = useState(0)
  const main = images[shown] ?? images[0]

  if (!main) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-[20px] bg-white">
        <Image
          src={main.src}
          alt={main.alt}
          width={MAIN_SIZE}
          height={MAIN_SIZE}
          className="h-full w-full object-cover"
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
        />
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setShown(index)}
              aria-label={image.alt}
              aria-pressed={index === shown}
              className={`aspect-square overflow-hidden rounded-xl bg-white ${
                index === shown ? 'ring-2 ring-yellow' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={image.src}
                alt=""
                width={THUMBNAIL_SIZE}
                height={THUMBNAIL_SIZE}
                className="h-full w-full object-cover"
                sizes="25vw"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
