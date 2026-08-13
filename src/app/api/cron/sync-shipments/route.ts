import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { ENV, requireEnv } from '@/lib/env'
import { syncDispatchedOrders } from '@/lib/orders/dispatch'

export const runtime = 'nodejs'

/**
 * Checks Packeta for orders that have been handed over and emails the customer.
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const provided = request.headers.get('authorization') ?? ''
  if (!matchesSecret(provided, `Bearer ${requireEnv(ENV.cronSecret)}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const report = await syncDispatchedOrders()
    if (report.errors.length > 0) {
      console.error('[sync-shipments] finished with errors', report.errors)
    }
    return NextResponse.json(report)
  } catch (error) {
    console.error('[sync-shipments] failed', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

function matchesSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
