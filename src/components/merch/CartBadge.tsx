'use client'

import Link from 'next/link'
import { useCart } from '@/components/merch/useCart'
import { ROUTES } from '@/lib/site'

export function CartBadge() {
  const { itemCount } = useCart()

  return (
    <Link href={ROUTES.merchCart} className="relative text-sm font-medium text-black underline">
      Košík
      {itemCount > 0 ? (
        <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-yellow px-2 text-xs font-bold text-white no-underline">
          {itemCount}
        </span>
      ) : null}
    </Link>
  )
}
