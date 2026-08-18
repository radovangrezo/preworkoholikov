import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/LegalPage'
import { DATA_PROTECTION_AUTHORITY, SELLER } from '@/lib/config/seller'
import { BOOK } from '@/lib/site'

const TITLE = 'Ochrana osobných údajov'

/** Third parties that see order data. Keep in sync with the services we actually use. */
const PROCESSORS = [
  { name: 'Stripe Payments Europe, Ltd.', purpose: 'spracovanie platby kartou' },
  { name: 'Packeta Slovakia s. r. o.', purpose: 'doručenie knihy' },
  { name: 'Printful', purpose: 'výroba a doručenie merchu' },
  { name: 'Resend, Inc.', purpose: 'odosielanie e-mailov o objednávke' },
  { name: 'Supabase, Inc.', purpose: 'databáza objednávok' },
  { name: 'Vercel, Inc.', purpose: 'hosting webovej stránky' },
]

export const metadata: Metadata = {
  title: `${TITLE} – ${BOOK.title}`,
  description: 'Ako spracúvame osobné údaje pri objednávke knihy.',
}

export default function PrivacyPage() {
  return (
    <LegalPage title={TITLE}>
      <LegalSection title="Prevádzkovateľ">
        <p>
          {SELLER.name}, {SELLER.address}, IČO: {SELLER.businessId}
          <br />
          E-mail: {SELLER.email}
        </p>
      </LegalSection>

      <LegalSection title="Aké údaje spracúvame">
        <p>
          Pri objednávke spracúvame meno a priezvisko, e-mailovú adresu, telefónne číslo a údaje
          potrebné na doručenie (vybrané výdajné miesto alebo doručovacia adresa). Ďalej spracúvame
          údaje o objednávke a o jej zaplatení. Údaje o platobnej karte nespracúvame ani k nim
          nemáme prístup — spracúva ich priamo poskytovateľ platobných služieb.
        </p>
      </LegalSection>

      <LegalSection title="Na aký účel a na akom právnom základe">
        <ul className="list-disc pl-6">
          <li>
            Vybavenie objednávky a doručenie tovaru — plnenie zmluvy podľa čl. 6 ods. 1 písm. b)
            GDPR.
          </li>
          <li>
            Vedenie účtovnej a daňovej evidencie — plnenie zákonnej povinnosti podľa čl. 6 ods. 1
            písm. c) GDPR.
          </li>
          <li>
            Vybavenie reklamácií a odstúpení od zmluvy — plnenie zmluvy a zákonných povinností.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Komu údaje poskytujeme">
        <p>Na vybavenie objednávky využívame týchto sprostredkovateľov:</p>
        <ul className="list-disc pl-6">
          {PROCESSORS.map((processor) => (
            <li key={processor.name}>
              {processor.name} — {processor.purpose}
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="Ako dlho údaje uchovávame">
        <p>
          Údaje o objednávke uchovávame po dobu potrebnú na vybavenie objednávky a následne po dobu
          vyžadovanú právnymi predpismi, najmä v oblasti účtovníctva.
        </p>
      </LegalSection>

      <LegalSection title="Vaše práva">
        <p>
          Máte právo na prístup k svojim údajom, na ich opravu, vymazanie, obmedzenie spracúvania,
          na prenosnosť údajov a právo podať sťažnosť dozornému orgánu. Prevádzkovateľ je usadený
          v Českej republike, preto je jeho dozorným orgánom {DATA_PROTECTION_AUTHORITY.name},{' '}
          {DATA_PROTECTION_AUTHORITY.address} (
          <a
            href={DATA_PROTECTION_AUTHORITY.url}
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            {new URL(DATA_PROTECTION_AUTHORITY.url).hostname}
          </a>
          ). Sťažnosť môžete podať aj dozornému orgánu v krajine svojho bydliska. Svoje práva
          môžete uplatniť e-mailom na {SELLER.email}.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
