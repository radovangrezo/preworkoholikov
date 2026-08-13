import { COUNTRY_LABELS, DELIVERY_LABELS } from '@/lib/config/commerce'
import type { OutgoingEmail } from '@/lib/email/client'
import { formatEur } from '@/lib/money'
import type { OrderItemRow, OrderRow } from '@/lib/orders/types'
import { trackingUrl } from '@/lib/packeta/packet'
import { BOOK, ROUTES, SITE_URL, shippingNotice } from '@/lib/site'

/** Email clients need inline styles, so the palette is repeated here deliberately. */
const EMAIL_COLORS = {
  cream: '#f7f3ed',
  yellow: '#e5a624',
  text: '#000000',
  muted: '#555555',
  border: '#e2ddd4',
}

export function buildOrderConfirmationEmail(
  order: OrderRow,
  items: OrderItemRow[],
): OutgoingEmail {
  const subject = `Potvrdenie objednávky ${order.order_number}`

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;">${escapeHtml(item.title)} × ${item.quantity}</td>
          <td style="padding:8px 0;text-align:right;white-space:nowrap;">
            ${escapeHtml(formatEur(item.unit_price_cents * item.quantity))}
          </td>
        </tr>`,
    )
    .join('')

  const html = layout(
    `Ďakujeme za objednávku`,
    `
      <p style="margin:0 0 16px;">
        Dobrý deň ${escapeHtml(order.customer_name)}, vaša objednávka
        <strong>${escapeHtml(order.order_number)}</strong> je zaplatená a už ju pripravujeme.
      </p>

      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        ${rows}
        <tr>
          <td style="padding:8px 0;border-top:1px solid ${EMAIL_COLORS.border};">Doprava — ${escapeHtml(DELIVERY_LABELS[order.delivery_method])}</td>
          <td style="padding:8px 0;text-align:right;border-top:1px solid ${EMAIL_COLORS.border};white-space:nowrap;">
            ${escapeHtml(formatEur(order.shipping_cents))}
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;font-weight:bold;border-top:2px solid ${EMAIL_COLORS.text};">Celkom</td>
          <td style="padding:12px 0;text-align:right;font-weight:bold;border-top:2px solid ${EMAIL_COLORS.text};white-space:nowrap;">
            ${escapeHtml(formatEur(order.total_cents))}
          </td>
        </tr>
      </table>

      <h2 style="font-size:16px;margin:0 0 8px;">Doručenie</h2>
      <p style="margin:0 0 24px;color:${EMAIL_COLORS.muted};">
        ${deliverySummaryHtml(order)}
      </p>

      <p style="margin:0;color:${EMAIL_COLORS.muted};font-size:14px;">
        ${escapeHtml(shippingNotice())}
      </p>
    `,
  )

  const text = [
    `Ďakujeme za objednávku ${order.order_number}.`,
    '',
    ...items.map(
      (item) => `${item.title} × ${item.quantity} — ${formatEur(item.unit_price_cents * item.quantity)}`,
    ),
    `Doprava (${DELIVERY_LABELS[order.delivery_method]}) — ${formatEur(order.shipping_cents)}`,
    `Celkom — ${formatEur(order.total_cents)}`,
    '',
    'Doručenie:',
    deliverySummaryText(order),
    '',
    shippingNotice(),
  ].join('\n')

  return { to: order.email, subject, html, text }
}

export function buildShippedEmail(order: OrderRow): OutgoingEmail {
  const subject = `Objednávka ${order.order_number} je na ceste`
  const tracking = order.packeta_barcode ? trackingUrl(order.packeta_barcode) : null

  const html = layout(
    `Zásielka je na ceste`,
    `
      <p style="margin:0 0 16px;">
        Dobrý deň ${escapeHtml(order.customer_name)}, vašu objednávku
        <strong>${escapeHtml(order.order_number)}</strong> sme odoslali.
      </p>

      <h2 style="font-size:16px;margin:24px 0 8px;">Doručenie</h2>
      <p style="margin:0 0 24px;color:${EMAIL_COLORS.muted};">
        ${deliverySummaryHtml(order)}
      </p>

      ${
        tracking
          ? `<p style="margin:0 0 24px;">
               <a href="${escapeHtml(tracking)}" style="background:${EMAIL_COLORS.yellow};color:#ffffff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block;">
                 Sledovať zásielku
               </a>
             </p>
             <p style="margin:0;color:${EMAIL_COLORS.muted};font-size:14px;">
               Číslo zásielky: ${escapeHtml(order.packeta_barcode ?? '')}
             </p>`
          : ''
      }
    `,
  )

  const text = [
    `Vašu objednávku ${order.order_number} sme odoslali.`,
    '',
    'Doručenie:',
    deliverySummaryText(order),
    ...(tracking ? ['', `Sledovanie zásielky: ${tracking}`] : []),
  ].join('\n')

  return { to: order.email, subject, html, text }
}

function layout(heading: string, body: string): string {
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

function deliverySummaryHtml(order: OrderRow): string {
  return escapeHtml(deliverySummaryText(order)).replace(/\n/g, '<br />')
}

function deliverySummaryText(order: OrderRow): string {
  const recipient = `${order.customer_name} ${order.customer_surname}`
  const country = COUNTRY_LABELS[order.country]

  if (order.delivery_method === 'pickup_point') {
    return [recipient, order.pickup_point_name ?? 'Výdajné miesto Packeta', country].join('\n')
  }

  return [
    recipient,
    `${order.street ?? ''} ${order.house_number ?? ''}`.trim(),
    `${order.zip ?? ''} ${order.city ?? ''}`.trim(),
    country,
  ].join('\n')
}

/** Order data is customer-supplied, so every interpolation is escaped. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
