'use client'

import { useEffect } from 'react'
import { clearCart } from '@/lib/merch/cart-store'

/** The order is placed, so the basket that produced it is emptied. */
export function ClearCartOnMount() {
  useEffect(() => {
    clearCart()
  }, [])

  return null
}
