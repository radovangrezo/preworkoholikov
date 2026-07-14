import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// AI assistant crawlers are allowed on purpose: we want the book to be
// visible in generative search answers (ChatGPT, Claude, Perplexity, ...)
const AI_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: AI_CRAWLERS, allow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
