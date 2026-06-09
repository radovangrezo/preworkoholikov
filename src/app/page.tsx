const IMAGES = {
  heroIllustration: '/images/hero-illustration.png',
  heroBookStack: '/images/hero-book-stack.png',
  openBook1: '/images/open-book-1.png',
  openBook2: '/images/open-book-2.png',
  openBook3: '/images/open-book-3.png',
  authorIllustration: '/images/author-illustration.png',
  shopCover1: '/images/shop-cover-1.png',
  shopCover2: '/images/shop-cover-2.png',
  socialIcons: '/images/social-icons.svg',
}

const QUOTES = [
  {
    text: "If you look at space companies, they've failed either because they've had a technical solution where success was not a possible outcome, they were unable to attract a critical mass of talent, or they just ran out of money. The finish line is usually a lot further away than you think.",
    author: 'Elon Musk',
    role: 'CEO of SpaceX',
    link: 'https://spacex.com',
  },
  {
    text: "If you look at space companies, they've failed either because they've had a technical solution where success was not a possible outcome, they were unable to attract a critical mass of talent, or they just ran out of money. The finish line is usually a lot further away than you think.",
    author: 'Elon Musk',
    role: 'CEO of SpaceX',
    link: 'https://spacex.com',
  },
  {
    text: "If you look at space companies, they've failed either because they've had a technical solution where success was not a possible outcome, they were unable to attract a critical mass of talent, or they just ran out of money. The finish line is usually a lot further away than you think.",
    author: 'Elon Musk',
    role: 'CEO of SpaceX',
    link: 'https://spacex.com',
  },
]

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
    <section className="bg-[#f7f3ed] py-12 flex flex-col items-center gap-4">
      <div className="flex items-baseline gap-3">
        <span className="text-[60px] font-bold leading-none text-black">€19,99</span>
        <span className="text-2xl font-light text-black">(na sklade)</span>
      </div>
      <a
        href="https://martinus.sk"
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnClass} rounded-full px-10 py-4 text-xl font-bold no-underline`}
      >
        Predobjednať na Martinus.sk
      </a>
    </section>
  )
}

function QuoteCard({ text, author, role, link }: (typeof QUOTES)[0]) {
  return (
    <div className="bg-white rounded-[20px] p-8 flex flex-col gap-2 flex-1">
      <span className="text-[#e5a624] text-6xl font-bold leading-none">&ldquo;</span>
      <p className="text-base italic font-light text-black leading-5 flex-1">{text}</p>
      <p className="text-sm font-medium italic text-black mt-2">
        {author},{' '}
        <a href={link} target="_blank" rel="noopener noreferrer" className="underline">
          {role}
        </a>
      </p>
    </div>
  )
}

export default function Page() {
  return (
    <main className="bg-[#f7f3ed] min-h-screen">
      {/* Navbar */}
      <nav className="bg-black w-full h-14 flex items-center justify-end px-8">
        <div className="flex gap-8 text-[#f7f3ed] text-lg font-bold">
          <a href="#about" className="hover:text-[#e5a624] transition-colors">About the Book</a>
          <a href="#buy" className="hover:text-[#e5a624] transition-colors">Where to Buy</a>
          <a href="#author" className="hover:text-[#e5a624] transition-colors">Author</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex w-full" style={{ maxHeight: '522px' }}>
        <div className="w-[58%] overflow-hidden">
          <img
            src={IMAGES.heroIllustration}
            alt="Rozprávky pre workoholikov – ilustrácia"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="w-[42%] overflow-hidden">
          <img
            src={IMAGES.heroBookStack}
            alt="Rozprávky pre workoholikov – kniha"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Price CTA 1 */}
      <PriceCta buttonColor="yellow" />

      {/* Testimonials */}
      <section className="bg-[#f7f3ed] px-5 pb-12">
        <div className="flex gap-5 max-w-[1366px] mx-auto">
          {QUOTES.map((q, i) => (
            <QuoteCard key={i} {...q} />
          ))}
        </div>
      </section>

      {/* Book Section 1 — About the book */}
      <section id="about" className="flex w-full">
        <div className="w-1/2 bg-white flex items-center px-[134px] py-12">
          <p className="text-2xl text-black leading-relaxed">
            Baví vás vaša práca? Milujete svojich kolegov? Máte skvelého šéfa? Považujete firmu, v
            ktorej pracujete, za stelesnené dobro a dar ľudstvu?
            <br />
            <br />
            V tom prípade vám túto knihu celkom určite niekto z priateľov alebo rodiny daruje. Aby
            ste konečne vytriezveli.
          </p>
        </div>
        <div className="w-1/2 overflow-hidden" style={{ maxHeight: '435px' }}>
          <img
            src={IMAGES.openBook1}
            alt="Otvorená kniha"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Bullet Section 1 */}
      <section className="flex w-full">
        <div className="w-1/2 overflow-hidden" style={{ maxHeight: '435px' }}>
          <img
            src={IMAGES.openBook2}
            alt="Rozprávky pre workoholikov – ilustrovaná postava"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="w-1/2 bg-[#f7f3ed] flex items-center px-16 py-12">
          <div className="text-2xl text-black">
            <p className="font-bold mb-4">
              V 42 krátkych príbehoch nájdete všetko, čo si o práci myslíte, ale nemôžete povedať
              nahlas, pretože musíte splácať hypotéku:
            </p>
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
      <section className="flex w-full">
        <div className="w-1/2 bg-white flex items-center px-[134px] py-12">
          <div className="text-2xl text-black">
            <p className="font-bold mb-4">Prečítajte si trpko-smiešnu pravdu o:</p>
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
        <div className="w-1/2 overflow-hidden" style={{ maxHeight: '435px' }}>
          <img
            src={IMAGES.openBook3}
            alt="Otvorená kniha"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Author Section */}
      <section id="author" className="flex w-full">
        <div className="w-1/2 overflow-hidden" style={{ maxHeight: '435px' }}>
          <img
            src={IMAGES.authorIllustration}
            alt="Radovan Andrej Grežo"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="w-1/2 bg-[#f7f3ed] flex items-center px-16 py-12">
          <div className="text-2xl text-black">
            <p className="font-bold mb-4">Radovan Andrej Grežo</p>
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
      <section id="buy" className="bg-[#f7f3ed] py-12 px-5">
        <div className="flex gap-5 max-w-[1366px] mx-auto">
          {SHOP_BOOKS.map((book, i) => (
            <div
              key={i}
              className="bg-white rounded-[20px] flex-1 flex flex-col items-center pb-8 overflow-hidden"
            >
              <div className="w-full h-[313px] overflow-hidden">
                <img
                  src={book.cover}
                  alt={`Kniha ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[32px] font-bold text-black mt-6 mb-4">{book.price}</p>
              <a
                href="https://martinus.sk"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#e5a624] text-black rounded-full px-14 py-3 text-2xl font-bold"
              >
                Kúpiť
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black w-full flex justify-center items-center py-6">
        <img
          src={IMAGES.socialIcons}
          alt="Sociálne siete"
          className="h-12"
        />
      </footer>
    </main>
  )
}
