import type { MetadataRoute } from 'next'
import { ROUTES, SITE_URL } from '@/lib/site'

/** Checkout and thank-you pages are deliberately left out: they are noindex. */
const PAGES: { path: string; priority: number; changeFrequency: 'monthly' | 'yearly' }[] = [
  { path: '', priority: 1, changeFrequency: 'monthly' },
  { path: ROUTES.terms, priority: 0.3, changeFrequency: 'yearly' },
  { path: ROUTES.privacy, priority: 0.3, changeFrequency: 'yearly' },
  { path: ROUTES.withdrawal, priority: 0.3, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}
