import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/LegalPage'
import {
  COUNTRIES,
  COUNTRY_LABELS,
  COUNTRY_LABELS_GENITIVE,
  DELIVERY_LABELS,
  PAYMENT_METHOD_LABELS,
  SHIPPING_CENTS,
  VAT_RATE_PERCENT,
} from '@/lib/config/commerce'
import {
  DISPATCH_TIME,
  SELLER,
  SUPERVISORY_AUTHORITY,
  TERMS_EFFECTIVE_DATE,
} from '@/lib/config/seller'
import { formatEur } from '@/lib/money'
import { BOOK, ROUTES } from '@/lib/site'

const TITLE = 'Obchodné podmienky'
const WITHDRAWAL_DAYS = 14

/** Slovak renders the month in the genitive, e.g. "13. augusta 2026". */
const EFFECTIVE_DATE = new Intl.DateTimeFormat('sk-SK', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${TERMS_EFFECTIVE_DATE}T00:00:00Z`))

export const metadata: Metadata = {
  title: `${TITLE} – ${BOOK.title}`,
  description: `Obchodné podmienky pre nákup knihy ${BOOK.title}.`,
}

export default function TermsPage() {
  return (
    <LegalPage title={TITLE}>
      <LegalSection title="1. Predávajúci">
        <p>
          {SELLER.name}, {SELLER.address}
          <br />
          IČO: {SELLER.businessId}, DIČ: {SELLER.taxId}, IČ DPH: {SELLER.vatId}
          <br />
          {SELLER.registration}
          <br />
          E-mail: {SELLER.email}, telefón: {SELLER.phone}
        </p>
      </LegalSection>

      <LegalSection title="2. Objednávka a uzavretie zmluvy">
        <p>
          Kupujúci objednáva knihu prostredníctvom objednávkového formulára na tejto stránke.
          Odoslaním objednávky a jej zaplatením vzniká kúpna zmluva medzi kupujúcim a predávajúcim.
          Prijatie objednávky potvrdíme e-mailom na adresu uvedenú v objednávke.
        </p>
      </LegalSection>

      <LegalSection title="3. Cena a platba">
        <p>
          Cena knihy je {BOOK.priceDisplay} za kus vrátane DPH. Sadzba DPH sa riadi krajinou
          doručenia:{' '}
          {COUNTRIES.map((country) => `${COUNTRY_LABELS[country]} ${VAT_RATE_PERCENT[country]} %`)
            .join(', ')}
          . K cene sa pripočítava cena dopravy podľa zvoleného spôsobu doručenia. Celková cena je
          vždy zobrazená pred odoslaním objednávky.
        </p>
        <p>
          Platiť je možné týmito spôsobmi: {PAYMENT_METHOD_LABELS.join(', ')}. Platbu spracúva
          poskytovateľ platobných služieb Stripe; platobné údaje sa nezadávajú na našej stránke a
          predávajúci k nim nemá prístup.
        </p>
      </LegalSection>

      <LegalSection title="4. Doprava a dodanie">
        <p>
          Zásielky doručujeme prostredníctvom spoločnosti Packeta do{' '}
          {COUNTRY_LABELS_GENITIVE.SK} a {COUNTRY_LABELS_GENITIVE.CZ}. Ceny dopravy:
        </p>
        <ul className="list-disc pl-6">
          {COUNTRIES.map((country) =>
            Object.entries(SHIPPING_CENTS[country]).map(([method, cents]) => (
              <li key={`${country}-${method}`}>
                {COUNTRY_LABELS[country]} — {DELIVERY_LABELS[method as keyof typeof DELIVERY_LABELS]}
                : {formatEur(cents)}
              </li>
            )),
          )}
        </ul>
        <p>Zásielku odosielame {DISPATCH_TIME}.</p>
      </LegalSection>

      <LegalSection title={`5. Odstúpenie od zmluvy do ${WITHDRAWAL_DAYS} dní`}>
        <p>
          Kupujúci, ktorý je spotrebiteľom, má právo odstúpiť od zmluvy do {WITHDRAWAL_DAYS} dní od
          prevzatia tovaru, a to aj bez uvedenia dôvodu. Podrobný postup a vzorový formulár nájdete
          na stránke{' '}
          <a href={ROUTES.withdrawal} className="underline">
            Odstúpenie od zmluvy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Reklamácie">
        <p>
          Ak má tovar vady, kupujúci má právo na ich odstránenie alebo na vrátenie peňazí podľa
          platných predpisov. Reklamáciu je možné uplatniť e-mailom na {SELLER.email}. Reklamáciu
          vybavíme najneskôr do 30 dní od jej uplatnenia.
        </p>
      </LegalSection>

      <LegalSection title="7. Alternatívne riešenie sporov">
        <p>
          Kupujúci má právo obrátiť sa na predávajúceho so žiadosťou o nápravu. Ak predávajúci
          odpovie zamietavo alebo neodpovie do 30 dní, kupujúci môže podať návrh na mimosúdne
          riešenie spotrebiteľského sporu. Predávajúci je usadený v Českej republike, preto je
          príslušným subjektom {SUPERVISORY_AUTHORITY.name}, {SUPERVISORY_AUTHORITY.detail},
          e-mail: {SUPERVISORY_AUTHORITY.email}. Viac informácií:{' '}
          <a
            href={SUPERVISORY_AUTHORITY.adrUrl}
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            {new URL(SUPERVISORY_AUTHORITY.adrUrl).hostname}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="8. Ochrana osobných údajov">
        <p>
          Informácie o spracúvaní osobných údajov nájdete na stránke{' '}
          <a href={ROUTES.privacy} className="underline">
            Ochrana osobných údajov
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="9. Záverečné ustanovenia">
        <p>
          Tieto obchodné podmienky sú platné od{' '}
          <time dateTime={TERMS_EFFECTIVE_DATE}>{EFFECTIVE_DATE}</time>. Vzťahy neupravené
          týmito podmienkami sa riadia právnym poriadkom Českej republiky. Voľba práva nezbavuje
          spotrebiteľa ochrany, ktorú mu poskytujú záväzné právne predpisy krajiny jeho obvyklého
          pobytu.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
