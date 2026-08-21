import type { Metadata } from 'next'
import { CookieSettings } from '@/components/CookieSettings'
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
  { name: 'Google Ireland Limited', purpose: 'meranie návštevnosti — len s vaším súhlasom' },
  { name: 'Meta Platforms Ireland Limited', purpose: 'meranie účinnosti reklamy — len s vaším súhlasom' },
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
          <li>
            Meranie návštevnosti a účinnosti reklamy pomocou súborov cookie — váš súhlas podľa
            čl. 6 ods. 1 písm. a) GDPR. Bez neho neukladáme do vášho zariadenia nič a nevytvárame
            o vás žiadny identifikátor.
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

      <LegalSection title="Súbory cookie">
        <p>
          Na fungovanie stránky a na váš nákup nepotrebujeme žiadne sledovacie súbory cookie.
          Košík si ukladáme priamo vo vašom prehliadači a tieto údaje sa nikam neodosielajú.
        </p>
        <p>
          Nad rámec toho by sme radi vedeli, koľko ľudí na stránku chodí a ako sa nám darí
          s reklamou. Slúžia na to dva nástroje:
        </p>
        <ul className="list-disc pl-6">
          <li>
            Google Analytics spoločnosti Google Ireland Limited — meria návštevnosť stránky, teda
            ktoré stránky si ľudia otvárajú a odkiaľ prišli.
          </li>
          <li>
            Meta Pixel spoločnosti Meta Platforms Ireland Limited — zaznamenáva návštevy stránky
            a nákupy a spája ich s vaším účtom na Facebooku či Instagrame.
          </li>
        </ul>
        <p>
          Meta Pixel načítame výhradne vtedy, ak nám na to dáte súhlas. Kým sa nerozhodnete alebo
          ak nás odmietnete, do vášho prehliadača sa vôbec nedostane a Meta sa o vašej návšteve
          nedozvie.
        </p>
        <p>
          Google Analytics sa načíta vždy, ale bez vášho súhlasu beží v režime Google Consent Mode:
          neukladá do vášho zariadenia žiadne súbory cookie, nevytvára o vás identifikátor a Googlu
          odošle len základný údaj o načítaní stránky, ktorý nemožno spojiť s vami ani s vašou
          predchádzajúcou návštevou. Súčasťou takého spojenia je aj vaša IP adresa — Google
          Analytics ju neukladá a používa ju len na určenie približnej lokality. Až po udelení
          súhlasu meria bežným spôsobom.
        </p>
        <p>
          Súhlas je dobrovoľný a môžete ho kedykoľvek odvolať. Odvolanie nemá vplyv na zákonnosť
          spracúvania pred jeho odvolaním. Údaje sa spracúvajú aj v USA, na základe štandardných
          zmluvných doložiek Európskej komisie.
        </p>
        <CookieSettings />
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
