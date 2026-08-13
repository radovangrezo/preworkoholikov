import Link from 'next/link'

/** Shared shell for the legal pages, so each page only carries its own text. */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="bg-cream min-h-screen px-5 py-10 md:py-12">
      <article className="mx-auto max-w-[760px]">
        <Link href="/" className="text-sm text-black underline">
          ← Späť na stránku knihy
        </Link>
        <h1 className="mt-6 text-3xl md:text-[40px] font-bold leading-tight text-black">{title}</h1>
        <div className="mt-8 flex flex-col gap-4 text-black leading-relaxed">{children}</div>
      </article>
    </main>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-bold text-black">{title}</h2>
      {children}
    </section>
  )
}
