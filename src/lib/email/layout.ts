import { BOOK, ROUTES, SITE_URL } from '@/lib/site'

/** Email clients need inline styles, so the palette is repeated here deliberately. */
export const EMAIL_COLORS = {
  cream: '#f7f3ed',
  yellow: '#e5a624',
  text: '#000000',
  muted: '#555555',
  border: '#e2ddd4',
}

/** Shared shell for every transactional email, book or merch. */
export function layout(heading: string, body: string): string {
  return `<!doctype html>
<html lang="sk">
  <body style="margin:0;padding:24px;background:${EMAIL_COLORS.cream};font-family:Helvetica,Arial,sans-serif;color:${EMAIL_COLORS.text};">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;">
      <h1 style="font-size:22px;margin:0 0 24px;">${escapeHtml(heading)}</h1>
      ${body}
      <hr style="border:none;border-top:1px solid ${EMAIL_COLORS.border};margin:32px 0 16px;" />
      <p style="margin:0;font-size:12px;color:${EMAIL_COLORS.muted};">
        ${escapeHtml(BOOK.title)} ·
        <a href="${SITE_URL}" style="color:${EMAIL_COLORS.muted};">${escapeHtml(new URL(SITE_URL).hostname)}</a> ·
        <a href="${SITE_URL}${ROUTES.terms}" style="color:${EMAIL_COLORS.muted};">Obchodné podmienky</a> ·
        <a href="${SITE_URL}${ROUTES.withdrawal}" style="color:${EMAIL_COLORS.muted};">Odstúpenie od zmluvy</a>
      </p>
    </div>
  </body>
</html>`
}

/** Order data is customer-supplied, so every interpolation is escaped. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
