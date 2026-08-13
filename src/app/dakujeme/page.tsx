import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { DELIVERY_LABELS, ORDER_STATUS } from '@/lib/config/commerce'
import { IMAGES } from '@/lib/images'
import { formatEur } from '@/lib/money'
import { getOrderByPublicToken } from '@/lib/orders/repository'
import type { OrderWithItems } from '@/lib/orders/types'
import { BOOK, shippingNotice } from '@/lib/site'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TOKEN_PARAM = 'token'

export const metadata: Metadata = {
  title: `Ďakujeme za objednávku – ${BOOK.title}`,
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const token = typeof params[TOKEN_PARAM] === 'string' ? params[TOKEN_PARAM] : undefined
  const result = await loadOrder(token)

  return (
    <main className="bg-cream min-h-screen">
      <section className="w-full h-[180px] md:h-[300px] overflow-hidden">
        <Image
          {...IMAGES.heroIllustration}
          alt={BOOK.title}
          className="w-full h-full object-cover"
          sizes="100vw"
          priority
        />
      </section>

      <div className="mx-auto max-w-[680px] px-5 py-10 md:py-12">
        <h1 className="text-3xl md:text-[40px] font-bold leading-tight text-black">
          {BOOK.title}
        </h1>
        <h2 className="mt-3 text-2xl md:text-3xl font-bold text-black">Ďakujeme za objednávku</h2>

        {result ? <OrderSummary result={result} /> : <GenericConfirmation />}

        <Link href="/" className="mt-10 inline-block text-sm text-black underline">
          ← Späť na stránku knihy
        </Link>
      </div>
    </main>
  )
}

function OrderSummary({ result }: { result: OrderWithItems }) {
  const { order, items } = result
  const isPaid = order.status !== ORDER_STATUS.PENDING

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
              {item.title} × {item.quantity}
            </span>
            <span>{formatEur(item.unit_price_cents * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between py-1 text-black">
          <span>Doprava — {DELIVERY_LABELS[order.delivery_method]}</span>
          <span>{formatEur(order.shipping_cents)}</span>
        </div>
        <div className="mt-3 flex justify-between border-t-2 border-black pt-3 text-xl font-bold text-black">
          <span>Celkom</span>
          <span>{formatEur(order.total_cents)}</span>
        </div>
      </div>

      <p className="mt-6 text-black">{shippingNotice()}</p>
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

/** Never lets a bad token break the page: an unknown order falls back to a generic thank you. */
async function loadOrder(token: string | undefined): Promise<OrderWithItems | null> {
  if (!token || !UUID_PATTERN.test(token)) return null

  try {
    return await getOrderByPublicToken(token)
  } catch (error) {
    console.error('[thank-you] could not load order', error)
    return null
  }
}
