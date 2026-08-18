import { COUNTRY_LABELS, isCountry } from '@/lib/config/commerce'
import type { OutgoingEmail } from '@/lib/email/client'
import { EMAIL_COLORS, escapeHtml, layout } from '@/lib/email/layout'
import type { MerchOrderItemRow, MerchOrderRow } from '@/lib/merch/types'
import { formatEur } from '@/lib/money'

export function buildMerchConfirmationEmail(
  order: MerchOrderRow,
  items: MerchOrderItemRow[],
): OutgoingEmail {
  const subject = `Potvrdenie objednávky ${order.order_number}`

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;">${escapeHtml(describeItem(item))} × ${item.quantity}</td>
          <td style="padding:8px 0;text-align:right;white-space:nowrap;">
            ${escapeHtml(formatEur(item.unit_price_cents * item.quantity))}
          </td>
        </tr>`,
    )
    .join('')

  const html = layout(
    'Ďakujeme za objednávku',
    `
      <p style="margin:0 0 16px;">
        Dobrý deň ${escapeHtml(order.customer_name)}, vaša objednávka
        <strong>${escapeHtml(order.order_number)}</strong> je zaplatená a odovzdaná do výroby.
      </p>

      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        ${rows}
        <tr>
          <td style="padding:8px 0;border-top:1px solid ${EMAIL_COLORS.border};">Doprava</td>
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
        ${escapeHtml(addressText(order)).replace(/\n/g, '<br />')}
      </p>

      <p style="margin:0;color:${EMAIL_COLORS.muted};font-size:14px;">
        Každý kus tlačíme na objednávku, preto odoslanie trvá o niečo dlhšie. Keď zásielku
        odošleme, pošleme vám e-mail so sledovaním.
      </p>
    `,
  )

  const text = [
    `Ďakujeme za objednávku ${order.order_number}.`,
    '',
    ...items.map(
      (item) =>
        `${describeItem(item)} × ${item.quantity} — ${formatEur(item.unit_price_cents * item.quantity)}`,
    ),
    `Doprava — ${formatEur(order.shipping_cents)}`,
    `Celkom — ${formatEur(order.total_cents)}`,
    '',
    'Doručenie:',
    addressText(order),
    '',
    'Každý kus tlačíme na objednávku. Keď zásielku odošleme, pošleme vám e-mail so sledovaním.',
  ].join('\n')

  return { to: order.email, subject, html, text }
}

export function buildMerchShippedEmail(order: MerchOrderRow): OutgoingEmail {
  const subject = `Objednávka ${order.order_number} je na ceste`

  const html = layout(
    'Zásielka je na ceste',
    `
      <p style="margin:0 0 16px;">
        Dobrý deň ${escapeHtml(order.customer_name)}, vašu objednávku
        <strong>${escapeHtml(order.order_number)}</strong> sme odoslali.
      </p>

      <h2 style="font-size:16px;margin:24px 0 8px;">Doručenie</h2>
      <p style="margin:0 0 24px;color:${EMAIL_COLORS.muted};">
        ${escapeHtml(addressText(order)).replace(/\n/g, '<br />')}
      </p>

      ${
        order.tracking_url
          ? `<p style="margin:0 0 24px;">
               <a href="${escapeHtml(order.tracking_url)}" style="background:${EMAIL_COLORS.yellow};color:#ffffff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block;">
                 Sledovať zásielku
               </a>
             </p>`
          : ''
      }
    `,
  )

  const text = [
    `Vašu objednávku ${order.order_number} sme odoslali.`,
    '',
    'Doručenie:',
    addressText(order),
    ...(order.tracking_url ? ['', `Sledovanie zásielky: ${order.tracking_url}`] : []),
  ].join('\n')

  return { to: order.email, subject, html, text }
}

function describeItem(item: MerchOrderItemRow): string {
  const options = [item.color, item.size].filter(Boolean).join(', ')
  // Printful variant names already include the options, so avoid repeating them.
  return options && !item.name.includes(options) ? `${item.name} (${options})` : item.name
}

function addressText(order: MerchOrderRow): string {
  const country = isCountry(order.country_code)
    ? COUNTRY_LABELS[order.country_code]
    : order.country_code

  return [
    `${order.customer_name} ${order.customer_surname}`,
    order.address1,
    `${order.zip} ${order.city}`.trim(),
    country,
  ].join('\n')
}
