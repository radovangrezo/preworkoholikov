import Image from 'next/image'
import { BOOK, MARTINUS_NAME, MARTINUS_PRODUCT_URL, OG_IMAGE, SITE_URL } from '@/lib/site'

const SOCIAL_ICON_SIZE = 49

const IMAGES = {
  heroIllustration: { src: '/images/hero-illustration.webp', width: 2000, height: 1125 },
  heroBookStack: { src: '/images/hero-book-stack.webp', width: 1600, height: 1200 },
  openBook1: { src: '/images/open-book-1.webp', width: 1600, height: 1200 },
  openBook2: { src: '/images/open-book-2.webp', width: 1600, height: 1200 },
  openBook3: { src: '/images/open-book-3.webp', width: 1600, height: 1200 },
  authorIllustration: { src: '/images/author-illustration.webp', width: 1600, height: 1029 },
  shopCover1: { src: '/images/shop-cover-1.webp', width: 900, height: 1353 },
  shopCover2: { src: '/images/shop-cover-2.webp', width: 900, height: 604 },
  iconFacebook: { src: '/images/icon-facebook.svg', width: SOCIAL_ICON_SIZE, height: SOCIAL_ICON_SIZE },
  iconInstagram: { src: '/images/icon-instagram.svg', width: SOCIAL_ICON_SIZE, height: SOCIAL_ICON_SIZE },
  iconTiktok: { src: '/images/icon-tiktok.svg', width: SOCIAL_ICON_SIZE, height: SOCIAL_ICON_SIZE },
  characterIllustration: { src: '/images/character-illustration.svg', width: 174, height: 180 },
  bookIllustration: { src: '/images/book-illustration.svg', width: 184, height: 180 },
}

const QUOTES = [
  {
    text: 'Táto kniha funguje ako ventil. Aj sa odvzdušníte, aj sa zabavíte, aj na každom konci príbehu príde dopamínová odmena s twistom. Lepšie než Netflix.',
    author: 'Michal Pastier',
    role: 'marketér a angel investor',
  },
  {
    text: 'Posledné, čo workoholici potrebujú, sú rozprávky. Presne tieto.',
    author: 'Jakub Ptačin',
    role: 'zakladateľ Studio Echt',
  },
  {
    text: 'Rozprávky pre workoholikov som si prečítal v prvý deň svojich prázdnin s rodinou. Ani neviem, čo celý deň robili oni. Mám teda empiricky overené, že Rozprávky pre workoholikov sú záchranou pre každého workoholika. Dokonca aj pre takého, ktorý sa náhle ocitne uprostred dovolenky.',
    author: 'Jakub Nvota',
    role: 'režisér a spisovateľ',
  },
]

const FAQ = [
  {
    question: `O čom je kniha ${BOOK.title}?`,
    answer:
      'Je to zbierka 42 krátkych satirických príbehov o práci a korporátnom živote – o kariére, poradách, manažéroch, mzdách aj firemných hodnotách. S humorom hovorí to, čo si o práci myslíme, ale nahlas nepovieme.',
  },
  {
    question: 'Pre koho je kniha určená?',
    answer:
      'Pre každého, kto pracuje v korporáte, agentúre či kancelárii – a najmä pre workoholikov. Skvele funguje aj ako darček pre kolegov a priateľov, ktorí to s prácou preháňajú.',
  },
  {
    question: 'Koľko kniha stojí a kde ju kúpim?',
    answer: `Kniha stojí ${BOOK.priceDisplay} a predobjednáte si ju na Martinus.sk.`,
  },
  {
    question: 'Kto je autorom knihy?',
    answer: `Autorom je ${BOOK.author}, ktorý inšpiráciu zbieral počas 25 rokov práce v reklamných agentúrach na Slovensku aj v zahraničí. Predtým vydal Demotivačný diár pre rok 2021.`,
  },
]

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Book',
      name: BOOK.title,
      author: { '@type': 'Person', name: BOOK.author },
      description: BOOK.description,
      inLanguage: BOOK.language,
      image: `${SITE_URL}${OG_IMAGE.path}`,
      url: SITE_URL,
      offers: {
        '@type': 'Offer',
        price: BOOK.price,
        priceCurrency: BOOK.priceCurrency,
        availability: 'https://schema.org/PreOrder',
        url: MARTINUS_PRODUCT_URL,
        seller: { '@type': 'Organization', name: MARTINUS_NAME },
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ],
}

const SHOP_BOOKS = [
  { cover: IMAGES.shopCover1, price: '€XX,XX' },
  { cover: IMAGES.shopCover2, price: '€XX,XX' },
  { cover: IMAGES.shopCover1, price: '€XX,XX' },
]

function PriceCta({ buttonColor = 'yellow' }: { buttonColor?: 'yellow' | 'pink' }) {
  const btnClass =
    buttonColor === 'pink'
      ? 'bg-[#fad5e5] text-black'
      : 'bg-[#e5a624] text-white'

  return (
    <section className="bg-[#f7f3ed] py-10 md:py-12 flex flex-col items-center gap-4 px-6">
      <div className="flex items-baseline gap-3 flex-wrap justify-center">
        <span className="text-5xl md:text-[60px] font-bold leading-none text-black">{BOOK.priceDisplay}</span>
      </div>
      <a
        href={MARTINUS_PRODUCT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnClass} rounded-full px-8 md:px-10 py-4 text-lg md:text-xl font-bold no-underline text-center`}
      >
        Predobjednať na Martinus.sk
      </a>
    </section>
  )
}

function QuoteCard({ text, author, role }: (typeof QUOTES)[0]) {
  return (
    <div className="bg-white rounded-[20px] p-6 md:p-8 flex flex-col gap-2 flex-1 md:max-w-[442px]">
      <span className="text-[#e5a624] text-6xl font-bold leading-none">&ldquo;</span>
      <p className="text-sm md:text-base italic font-light text-black leading-5 flex-1">{text}</p>
      <p className="text-sm font-medium italic text-black mt-2">
        {author}, <span className="font-normal">{role}</span>
      </p>
    </div>
  )
}

export default function Page() {
  return (
    <main className="bg-[#f7f3ed] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />
      <h1 className="sr-only">
        {BOOK.title} – kniha od {BOOK.authorGenitive}
      </h1>

      {/* Hero — illustration */}
      <section className="flex flex-col md:flex-row w-full md:h-[522px]">
        <div className="w-full md:w-[58%] overflow-hidden">
          <Image
            {...IMAGES.heroIllustration}
            alt="Rozprávky pre workoholikov – ilustrácia"
            className="w-full h-full object-cover"
            sizes="(min-width: 768px) 58vw, 100vw"
            priority
          />
        </div>
        {/* Book stack: desktop only — shown inside hero row */}
        <div className="hidden md:block md:w-[42%] overflow-hidden h-full">
          <Image
            {...IMAGES.heroBookStack}
            alt="Rozprávky pre workoholikov – kniha"
            className="w-full h-full object-cover"
            sizes="(min-width: 768px) 42vw, 50vw"
            priority
          />
        </div>
      </section>

      {/* Mobile only: book stack + price side by side */}
      <section className="flex md:hidden w-full" style={{ minHeight: '260px' }}>
        <div className="w-1/2 overflow-hidden">
          <Image
            {...IMAGES.heroBookStack}
            alt="Rozprávky pre workoholikov – kniha"
            className="w-full h-full object-cover"
            sizes="50vw"
          />
        </div>
        <div className="w-1/2 bg-[#f7f3ed] flex flex-col items-center justify-center px-4 py-8 gap-4">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold leading-none text-black">{BOOK.priceDisplay}</span>
          </div>
          <a
            href={MARTINUS_PRODUCT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#e5a624] text-white rounded-full px-5 py-3 text-sm font-bold no-underline text-center"
          >
            Predobjednať na Martinus.sk
          </a>
        </div>
      </section>

      {/* Price CTA 1 — desktop only */}
      <div className="hidden md:block">
        <PriceCta buttonColor="yellow" />
      </div>

      {/* Testimonials */}
      <section className="bg-[#f7f3ed] px-5 pb-10 md:pb-12">
        <h2 className="sr-only">Čo hovoria čitatelia</h2>
        <div className="flex flex-col md:flex-row md:justify-center gap-5 max-w-[1366px] mx-auto">
          {QUOTES.map((q, i) => (
            <QuoteCard key={i} {...q} />
          ))}
        </div>
      </section>

      {/* Book Section 1 — About the book */}
      <section id="about" className="flex flex-col md:flex-row w-full">
        <h2 className="sr-only">O knihe</h2>
        <div className="w-full md:w-1/2 bg-white flex items-center px-8 md:px-[134px] py-10 md:py-12">
          <p className="text-xl md:text-2xl text-black leading-relaxed">
            Baví vás vaša práca? Milujete svojich kolegov? Máte skvelého šéfa? Považujete firmu, v
            ktorej pracujete, za stelesnené dobro a dar ľudstvu?
            <br />
            <br />
            V tom prípade vám túto knihu celkom určite niekto z priateľov alebo rodiny daruje. Aby
            ste konečne vytriezveli.
          </p>
        </div>
        <div className="w-full md:w-1/2 overflow-hidden" style={{ maxHeight: '435px', minHeight: '260px' }}>
          <Image
            {...IMAGES.openBook1}
            alt="Otvorená kniha"
            className="w-full h-full object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
      </section>

      {/* Character illustration divider */}
      <section className="bg-[#f7f3ed] flex justify-center py-8">
        <Image {...IMAGES.characterIllustration} alt="Ilustrácia postavy" />
      </section>

      {/* Bullet Section 1 */}
      <section className="flex flex-col md:flex-row w-full">
        <div className="w-full md:w-1/2 overflow-hidden order-2 md:order-1" style={{ maxHeight: '435px', minHeight: '260px' }}>
          <Image
            {...IMAGES.openBook2}
            alt="Rozprávky pre workoholikov – ilustrovaná postava"
            className="w-full h-full object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
        <div className="w-full md:w-1/2 bg-[#f7f3ed] flex items-center px-8 md:px-16 py-10 md:py-12 order-1 md:order-2">
          <div className="text-xl md:text-2xl text-black">
            <h2 className="font-bold mb-4">
              V 42 krátkych príbehoch nájdete všetko, čo si o práci myslíte, ale nemôžete povedať
              nahlas, pretože musíte splácať hypotéku:
            </h2>
            <ul className="list-disc pl-8 space-y-1">
              <li>výsmech cieľavedomému budovaniu kariéry,</li>
              <li>zosmiešňovanie obetavosti,</li>
              <li>parodovanie tímového ducha,</li>
              <li>prevracanie očami nad mzdovým ohodnotením,</li>
              <li>očierňovanie vysokopostavených manažérov,</li>
              <li>spochybňovanie dobrých úmyslov,</li>
              <li>a mnoho ďalšieho.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Price CTA 2 — pink */}
      <PriceCta buttonColor="pink" />

      {/* Bullet Section 2 */}
      <section className="flex flex-col md:flex-row w-full">
        <div className="w-full md:w-1/2 bg-white flex items-center px-8 md:px-[134px] py-10 md:py-12">
          <div className="text-xl md:text-2xl text-black">
            <h2 className="font-bold mb-4">Prečítajte si trpko-smiešnu pravdu o:</h2>
            <ul className="list-disc pl-8 space-y-1">
              <li>produktivite práce z domu,</li>
              <li>kamarátskych vzťahoch na pracovisku,</li>
              <li>náborových inzerátoch,</li>
              <li>dočasnom pracovaní do noci a cez víkendy,</li>
              <li>služobných cestách,</li>
              <li>firemných hodnotách,</li>
              <li>a ďalších.</li>
            </ul>
          </div>
        </div>
        <div className="w-full md:w-1/2 overflow-hidden" style={{ maxHeight: '435px', minHeight: '260px' }}>
          <Image
            {...IMAGES.openBook3}
            alt="Otvorená kniha"
            className="w-full h-full object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
      </section>

      {/* Book illustration divider */}
      <section className="bg-[#f7f3ed] flex justify-center py-8">
        <Image {...IMAGES.bookIllustration} alt="Ilustrácia knihy" />
      </section>

      {/* Author Section */}
      <section id="author" className="flex flex-col md:flex-row w-full">
        <div className="w-full md:w-1/2 overflow-hidden" style={{ maxHeight: '435px', minHeight: '260px' }}>
          <Image
            {...IMAGES.authorIllustration}
            alt="Radovan Andrej Grežo"
            className="w-full h-full object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
        <div className="w-full md:w-1/2 bg-[#f7f3ed] flex items-center px-8 md:px-16 py-10 md:py-12">
          <div className="text-xl md:text-2xl text-black">
            <h2 className="font-bold mb-4">{BOOK.author}</h2>
            <p className="leading-relaxed">
              vydal pred Rozprávkami pre workoholikov iba vtipný Demotivačný diár pre rok 2021.
              Inšpiráciu pre rozprávky zbieral počas 25 rokov v reklamných agentúrach na Slovensku
              aj v zahraničí. Rok si strihol mimo reklamného biznisu, na direktorskej pozícii v
              startupe. To všetko robil napriek tomu, že je pôvodným povolaním účtovník.
            </p>
          </div>
        </div>
      </section>

      {/* Price CTA 3 */}
      <PriceCta buttonColor="yellow" />

      {/* Where to Buy */}
      <section id="buy" className="bg-[#f7f3ed] py-10 md:py-12 px-5">
        <h2 className="sr-only">Kde kúpiť knihu</h2>
        <div className="flex flex-col md:flex-row gap-5 max-w-[1366px] mx-auto">
          {SHOP_BOOKS.map((book, i) => (
            <div
              key={i}
              className="bg-white rounded-[20px] flex-1 flex flex-col items-center pb-8 overflow-hidden"
            >
              <div className="w-full overflow-hidden" style={{ maxHeight: '313px', minHeight: '200px' }}>
                <Image
                  {...book.cover}
                  alt={`Kniha ${i + 1}`}
                  className="w-full h-full object-cover"
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
              </div>
              <p className="text-2xl md:text-[32px] font-bold text-black mt-6 mb-4">{book.price}</p>
              <a
                href={MARTINUS_PRODUCT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#e5a624] text-black rounded-full px-14 py-3 text-xl md:text-2xl font-bold no-underline"
              >
                Kúpiť
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white py-10 md:py-12 px-8">
        <div className="max-w-[900px] mx-auto">
          <h2 className="text-2xl md:text-[32px] font-bold text-black mb-8">Časté otázky</h2>
          <div className="flex flex-col gap-6">
            {FAQ.map((item) => (
              <div key={item.question}>
                <h3 className="text-lg md:text-xl font-bold text-black mb-2">{item.question}</h3>
                <p className="text-base md:text-lg text-black leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black w-full flex justify-center items-center gap-4 py-6">
        <a href="https://facebook.com/preworkoholikov" target="_blank" rel="noopener noreferrer">
          <Image {...IMAGES.iconFacebook} alt="Facebook" />
        </a>
        <a href="https://www.instagram.com/preworkoholikov" target="_blank" rel="noopener noreferrer">
          <Image {...IMAGES.iconInstagram} alt="Instagram" />
        </a>
        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
          <Image {...IMAGES.iconTiktok} alt="TikTok" />
        </a>
      </footer>
    </main>
  )
}
