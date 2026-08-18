import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { ENV, requireEnv } from '@/lib/env'
import { syncShippedMerchOrders } from '@/lib/merch/dispatch'
import { syncDispatchedOrders } from '@/lib/orders/dispatch'

export const runtime = 'nodejs'

/**
 * Emails customers whose orders are on their way: book orders once Packeta's packet status
 * moves, merch orders once Printful reports them fulfilled.
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const provided = request.headers.get('authorization') ?? ''
  if (!matchesSecret(provided, `Bearer ${requireEnv(ENV.cronSecret)}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Book and merch are checked independently so a failure in one still lets the other run.
  const [book, merch] = await Promise.allSettled([syncDispatchedOrders(), syncShippedMerchOrders()])

  const report = {
    book: book.status === 'fulfilled' ? book.value : { error: describe(book.reason) },
    merch: merch.status === 'fulfilled' ? merch.value : { error: describe(merch.reason) },
  }

  if (book.status === 'rejected' || merch.status === 'rejected') {
    console.error('[sync-shipments] a sync failed', report)
    return NextResponse.json(report, { status: 500 })
  }

  const errors = [...book.value.errors, ...merch.value.errors]
  if (errors.length > 0) {
    console.error('[sync-shipments] finished with errors', errors)
  }

  return NextResponse.json(report)
}

function matchesSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
