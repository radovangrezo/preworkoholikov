import type { Metadata } from 'next'
import Link from 'next/link'
import { ClearCartOnMount } from '@/components/merch/ClearCartOnMount'
import { MERCH_ORDER_STATUS } from '@/lib/config/merch'
import { getMerchOrderByPublicToken } from '@/lib/merch/repository'
import type { MerchOrderWithItems } from '@/lib/merch/types'
import { formatEur } from '@/lib/money'
import { BOOK, ROUTES } from '@/lib/site'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TOKEN_PARAM = 'token'

export const metadata: Metadata = {
  title: `Ďakujeme za objednávku – ${BOOK.title}`,
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function MerchThankYouPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const token = typeof params[TOKEN_PARAM] === 'string' ? params[TOKEN_PARAM] : undefined
  const result = await loadOrder(token)

  return (
    <main className="px-5 pb-12 md:px-8">
      <ClearCartOnMount />
      <div className="mx-auto max-w-[680px]">
        <h1 className="text-3xl md:text-[40px] font-bold leading-tight text-black">
          Ďakujeme za objednávku
        </h1>

        {result ? <OrderSummary result={result} /> : <GenericConfirmation />}

        <Link href={ROUTES.merch} className="mt-10 inline-block text-sm text-black underline">
          ← Späť do merchu
        </Link>
      </div>
    </main>
  )
}

function OrderSummary({ result }: { result: MerchOrderWithItems }) {
  const { order, items } = result
  const isPaid = order.status !== MERCH_ORDER_STATUS.PENDING

  return (
    <>
      <p className="mt-4 text-lg text-black">
        Objednávka <strong>{order.order_number}</strong>
        {isPaid
          ? ' je zaplatená. Potvrdenie sme vám poslali e-mailom.'
          : ' je prijatá. Platbu ešte spracúvame, potvrdenie dostanete e-mailom do niekoľkých minút.'}
      </p>

      <div className="mt-8 rounded-[20px] bg-white p-6 md:p-8">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between py-1 text-black">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatEur(item.unit_price_cents * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between py-1 text-black">
          <span>Doprava</span>
          <span>{formatEur(order.shipping_cents)}</span>
        </div>
        <div className="mt-3 flex justify-between border-t-2 border-black pt-3 text-xl font-bold text-black">
          <span>Celkom</span>
          <span>{formatEur(order.total_cents)}</span>
        </div>
      </div>

      <p className="mt-6 text-black">
        Každý kus tlačíme na objednávku, preto odoslanie trvá o niečo dlhšie. Keď zásielku
        odošleme, pošleme vám e-mail so sledovaním.
      </p>
    </>
  )
}

function GenericConfirmation() {
  return (
    <p className="mt-4 text-lg text-black">
      Vašu objednávku sme prijali. Potvrdenie s podrobnosťami sme vám poslali e-mailom.
    </p>
  )
}

async function loadOrder(token: string | undefined): Promise<MerchOrderWithItems | null> {
  if (!token || !UUID_PATTERN.test(token)) return null

  try {
    return await getMerchOrderByPublicToken(token)
  } catch (error) {
    console.error('[merch thank-you] could not load order', error)
    return null
  }
}
