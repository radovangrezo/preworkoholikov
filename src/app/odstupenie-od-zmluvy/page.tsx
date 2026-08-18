import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/LegalPage'
import { SELLER } from '@/lib/config/seller'
import { BOOK } from '@/lib/site'

const TITLE = 'Odstúpenie od zmluvy'
const WITHDRAWAL_DAYS = 14
const REFUND_DAYS = 14

export const metadata: Metadata = {
  title: `${TITLE} – ${BOOK.title}`,
  description: `Ako odstúpiť od zmluvy do ${WITHDRAWAL_DAYS} dní od prevzatia knihy.`,
}

export default function WithdrawalPage() {
  return (
    <LegalPage title={TITLE}>
      <LegalSection title={`Právo odstúpiť do ${WITHDRAWAL_DAYS} dní`}>
        <p>
          Ak ste spotrebiteľ, máte právo odstúpiť od zmluvy do {WITHDRAWAL_DAYS} dní odo dňa
          prevzatia tovaru, a to aj bez uvedenia dôvodu.
        </p>
      </LegalSection>

      <LegalSection title="Ako postupovať">
        <ol className="list-decimal pl-6">
          <li>
            Pošlite nám oznámenie o odstúpení e-mailom na {SELLER.email} alebo poštou na adresu{' '}
            {SELLER.address}. Môžete použiť vzor nižšie.
          </li>
          <li>
            Tovar zašlite späť na adresu {SELLER.address} najneskôr do {WITHDRAWAL_DAYS} dní od
            odstúpenia. Náklady na vrátenie tovaru nesie kupujúci.
          </li>
          <li>
            Kúpnu cenu vrátane nákladov na doručenie vám vrátime najneskôr do {REFUND_DAYS} dní, a
            to rovnakým spôsobom, akým ste platili, prípadne na účet, ktorý uvediete.
          </li>
        </ol>
      </LegalSection>

      <LegalSection title="Vzor oznámenia o odstúpení od zmluvy">
        <pre className="whitespace-pre-wrap rounded-[20px] bg-white p-6 text-sm text-black">
{`Komu: ${SELLER.name}, ${SELLER.address}, ${SELLER.email}

Týmto oznamujem, že odstupujem od zmluvy na tento tovar:
.................................................
(napr. ${BOOK.title}, alebo konkrétny kus merchu)

Číslo objednávky: ..............................
Dátum objednania: ..............................
Dátum prevzatia: ...............................

Meno a priezvisko spotrebiteľa: ................
Adresa spotrebiteľa: ...........................
IBAN pre vrátenie platby: ......................

Dátum: .........................................
Podpis (ak sa posiela v papierovej podobe): .....`}
        </pre>
      </LegalSection>
    </LegalPage>
  )
}
