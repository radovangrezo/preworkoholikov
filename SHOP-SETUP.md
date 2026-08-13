# Shop setup

The shop sells the book directly: card payment via Stripe, delivery via Packeta to Slovakia
and Czechia, and two emails (order confirmation, shipped). Orders land in your Packeta
client zone automatically, so you only print labels.

Everything below is one-time setup. Copy `.env.local.example` to `.env.local` as you go.

## 1. Supabase

1. Create a project at supabase.com.
2. Open **SQL Editor** and run `supabase/migrations/0001_orders.sql`.
3. Copy into `.env.local`:
   - `SUPABASE_URL` — Project settings → Data API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Project settings → API keys → `service_role`

The browser never talks to Supabase. Row Level Security is on with no policies, so orders
are reachable only through our own API routes using the service-role key.

## 2. Stripe

1. Get your API key from **Developers → API keys**. Prefer a **restricted key** (`rk_...`)
   with write access to Checkout Sessions and read access to PaymentIntents →
   `STRIPE_SECRET_KEY`.
2. **Settings → Payment methods**: enable **Card**, **Apple Pay**, **Google Pay** and **Link**.

   This is where payment methods are controlled — deliberately not in code, so you can change
   them later without a deploy. Stripe advises against hardcoding `payment_method_types`.

   - **Apple Pay needs no domain registration.** With hosted Checkout the Apple Pay button
     renders on `checkout.stripe.com`, not on your domain, and Stripe's docs state "no
     additional configuration is required to use Apple Pay in Checkout". You would only need to
     register `www.preworkoholikov.sk` under Payment method domains if we ever switched to
     embedded checkout.
   - **Testing wallets:** Apple Pay and Google Pay cannot be tested with Stripe test card
     numbers. Use a **real card** together with your **test** API keys — Stripe recognises the
     test key and does not charge it.
   - The customer-facing list of methods shown on the checkout page and in the terms comes from
     `PAYMENT_METHOD_LABELS` in `src/lib/config/commerce.ts`. Keep it in sync if you change the
     Dashboard settings.
3. Add a webhook at **Developers → Webhooks**:
   - URL: `https://www.preworkoholikov.sk/api/webhooks/stripe`
   - Events: **`checkout.session.completed`** and **`checkout.session.expired`**
   - Copy the signing secret (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

   Both events matter. `completed` fulfils the order; `expired` returns reserved copies to
   stock when a customer abandons checkout. Without `expired`, every abandoned cart would
   permanently consume a copy of the print run.

### Testing locally

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the secret that command prints as `STRIPE_WEBHOOK_SECRET`, then pay with test card
`4242 4242 4242 4242`, any future expiry, any CVC.

## 3. Packeta

From the Packeta client zone (**Settings → API**):

- `NEXT_PUBLIC_PACKETA_API_KEY` — the 16-character key. Used by the pickup-point widget in
  the browser, so it is public by design.
- `PACKETA_API_PASSWORD` — the API password used to create packets. Secret.
- `PACKETA_ESHOP_NAME` — must match the sender/eshop name registered in your account
  **exactly**, otherwise Packeta refuses to create packets.

Then get the home-delivery carrier IDs. Once `NEXT_PUBLIC_PACKETA_API_KEY` is saved in
`.env.local`, run this in the project folder:

```bash
npm run packeta:carriers
```

It prints something like `id=131  SK  Packeta Home SK`. Put the Slovak id in
`PACKETA_CARRIER_ID_HOME_SK` and the Czech one in `PACKETA_CARRIER_ID_HOME_CZ`.
If the script finds nothing, ask
e-commerce.support@packeta.com which carrier IDs your account should use for address
delivery. Pickup-point and Z-BOX orders do not need these — the widget supplies the id.

## 4. Resend

1. Add the domain `preworkoholikov.sk` in Resend and add the DNS records it shows you
   (typically an MX record plus TXT records for SPF and DKIM), then press Verify.

   Add them wherever this domain's DNS is actually managed — that is whoever the
   nameservers point at, which may be your registrar, Vercel, or Cloudflare, and is not
   necessarily where you bought the domain. The records are additive: they do not replace
   existing mail settings, so do not delete anything already there.

   **Until the domain is verified you cannot send from it at all** — Resend rejects the
   send rather than delivering it to spam.
2. `RESEND_API_KEY` — from API Keys.
3. `ORDER_EMAIL_FROM` — e.g. `Rozprávky <objednavky@preworkoholikov.sk>`.
4. `ORDER_EMAIL_BCC` — optional, your own address, to get a copy of every order.

### Testing emails before DNS propagates

You do not have to wait for verification to check that the emails themselves work. Set
`ORDER_EMAIL_FROM=onboarding@resend.dev` (Resend's shared test sender) and place a test
order using one of Resend's test recipients as the customer email:

- `delivered@resend.dev` — simulates successful delivery
- `bounced@resend.dev` — simulates a bounce

Swap `ORDER_EMAIL_FROM` back to your own domain once it is verified. Never leave the
shared test sender in production.

## 5. Cron for the shipped email

`CRON_SECRET` — any long random string:

```bash
openssl rand -hex 32
```

`vercel.json` already schedules `/api/cron/sync-shipments` hourly. Vercel sends
`Authorization: Bearer $CRON_SECRET` automatically once the variable is set in the project.

> On Vercel's Hobby plan cron jobs run only once per day. If you are on Hobby, either accept
> a daily shipped email or upgrade to Pro for the hourly schedule in `vercel.json`.

### How "shipped" is detected

Packeta does not publish a stable list of status codes, so nothing is hardcoded. When a
packet is created we record the status it starts at; the cron job marks the order shipped
the first time that status changes — in practice, when you hand the parcel over. Each run
returns the statuses it saw, so you can verify against a real order:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://www.preworkoholikov.sk/api/cron/sync-shipments
```

**Cancelled packets.** Cancelling a packet in Packeta is also a status change (statusCode 11,
codeText `cancelled`), so it is excluded explicitly — otherwise a customer whose order you just
cancelled would be told their parcel was on its way. Such orders appear in the run's
`notDispatched` list and stay `paid` with no shipped email, because what should happen next —
refund, or create a replacement packet — is a decision for you, not the cron job. Watch that
list: an order sitting in it is paid for and going nowhere.

## 5a. Stock

The print run is recorded in the `inventory` table (migration `0003`), currently **2950**
copies of SKU `RPW-001`.

A copy is claimed when a checkout starts, not when payment lands — otherwise two people could
both pass an availability check and pay for the same last copy. The claim and the availability
test happen in a single SQL statement (`claim_stock`), so simultaneous checkouts cannot both
succeed. A `check (claimed <= total_printed)` constraint backs this at the database level: even
a bug in the application cannot record more claims than there are copies.

Copies come back when Stripe reports the checkout expired, which is why that webhook event is
required. Checkout sessions are set to expire after **60 minutes**, so an abandoned cart holds
its copies for at most an hour.

When stock runs out, `/pokladna` shows a sold-out message instead of the form, and the API
refuses the order with 409 even if someone bypasses the page.

To check or change stock:

```sql
select sku, total_printed, claimed, total_printed - claimed as available from inventory;

-- after a reprint
update inventory set total_printed = total_printed + 1000 where sku = 'RPW-001';
```

## 6. Test run (before Packeta and Resend are configured)

You can verify most of the shop with only Supabase and Stripe set up. Packeta and email will
fail — that is the point: a paid order must survive both failures.

1. **Test-mode keys.** Flip **Test mode** in the Stripe Dashboard, then Developers → API keys.
   Put the test secret key (`sk_test_…`) in `.env.local` as `STRIPE_SECRET_KEY`. Also check
   Settings → Payment methods on the test side — it is configured separately from live.
2. **Install the Stripe CLI** and log in:
   ```bash
   npm i -g @stripe/cli
   stripe login
   ```
3. **Terminal 1** — the app:
   ```bash
   npm run dev
   ```
4. **Terminal 2** — forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the `whsec_…` it prints into `.env.local` as `STRIPE_WEBHOOK_SECRET`, then **restart
   the dev server** — Next.js only reads env vars at startup.
5. **Place an order** at http://localhost:3000/pokladna. Pick **Doručenie na adresu**: the
   pickup-point widget needs a Packeta key you do not have yet. Any 5-digit ZIP works.
6. **Pay** with `4242 4242 4242 4242`, any future expiry, any CVC.

### What success looks like

- Browser lands on `/dakujeme?token=…` showing the order summary.
- Terminal 2 shows `checkout.session.completed` with a `200` response.
- Terminal 1 logs `[stripe-webhook] order RPW-…-… needs attention` listing two failures: a
  missing Packeta variable and a missing Resend key. **This is the expected result.**
- In Supabase → Table Editor → `orders`, the row shows `status = paid`, `paid_at` set, and
  `packeta_error` filled in.

That last point is the whole design: Stripe took the money, Packeta and email both failed, and
the order is still recorded as paid rather than lost.

## 7. Before going live

- [ ] **Stripe account fully activated** — card payments approved, not merely keys issued. A
      new account sits in "pending approval" until Stripe finishes reviewing your business.
      Test mode works throughout; live charges and payouts do not. If it stays pending, check
      the Dashboard for outstanding requirements — the review often waits on you.
- [ ] Live keys set in the Vercel project's environment variables, **not** in `.env.local`.
      Keep `.env.local` on test keys.
- [ ] Fill in every `[DOPLNIŤ]` value in `src/lib/config/seller.ts` — company name, address,
      IČO, DIČ, IČ DPH, contact details, dispatch time. These appear on the legal pages and
      are legally required.
- [ ] Have the three legal pages reviewed by someone qualified. They are a starting skeleton,
      not legal advice: `/obchodne-podmienky`, `/ochrana-osobnych-udajov`,
      `/odstupenie-od-zmluvy`.
- [ ] Confirm the shipping weight of one copy — `PRODUCT.weightKg` in
      `src/lib/config/commerce.ts` is currently **0.4 kg**, a guess. Packeta prices by weight.
- [ ] Confirm the shipping prices in `SHIPPING_CENTS` (currently SK €2,90 / €4,90 and
      CZ €3,90 / €5,90) against your real Packeta tariff.
- [ ] Decide about VAT. Prices are treated as VAT-inclusive and no tax is calculated by
      Stripe. Books have a reduced VAT rate in Slovakia — check with your accountant, and note
      that selling to Czech customers has its own VAT implications.
- [ ] Run one real end-to-end order with a live card before announcing.

## 8. Environment variables in Vercel

Project → Settings → Environment Variables. Scope them to **Production**.

| Variable | Value | Same as `.env.local`? |
| --- | --- | --- |
| `SUPABASE_URL` | `https://<ref>.supabase.co` — no path, no trailing slash | yes¹ |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | yes¹ |
| `STRIPE_SECRET_KEY` | **live** key `rk_live_…` | **NO — live, not test** |
| `STRIPE_WEBHOOK_SECRET` | signing secret of the **live** webhook endpoint | **NO — live endpoint** |
| `NEXT_PUBLIC_PACKETA_API_KEY` | 16-character widget key (public by design) | yes |
| `PACKETA_API_PASSWORD` | API password | yes |
| `PACKETA_ESHOP_NAME` | `Somebody` | yes |
| `PACKETA_CARRIER_ID_HOME_SK` | `131` | yes |
| `PACKETA_CARRIER_ID_HOME_CZ` | `106` | yes |
| `RESEND_API_KEY` | `re_…` | yes |
| `ORDER_EMAIL_FROM` | `Rozprávky Pre Workoholikov <objednavky@preworkoholikov.sk>` | yes |
| `ORDER_EMAIL_BCC` | *optional* — your address, to copy every order | yes |
| `CRON_SECRET` | long random string | yes² |

¹ Unless you create a separate Supabase project for production, in which case use that
project's values and run migrations `0001`–`0003` against it.
² Vercel Cron reads this to authorise `/api/cron/sync-shipments`. Any long random value works.

### Two traps

**Do not put live Stripe keys in the Preview environment.** Preview deployments are easier to
reach and every test order against a live key charges a real card. Scope live keys to
Production only; if you want working previews, give Preview the test keys instead.

**Environment variables are read at build time.** Adding or changing one does nothing until you
redeploy.

### Live-mode Stripe checklist

Test and live mode are separate worlds in Stripe. On the live side you need, independently of
what you configured for testing:

- Payment methods enabled: Card, Apple Pay, Google Pay, Link
- A webhook endpoint at `https://www.preworkoholikov.sk/api/webhooks/stripe` subscribed to
  **both** `checkout.session.completed` and `checkout.session.expired`
- The account itself out of "pending approval" — test mode never needed this, live payments do

## Order lifecycle

```
customer submits /pokladna
  → POST /api/checkout   validates input, prices it server-side, creates a pending order
  → Stripe Checkout      customer pays (card data never touches our server)
  → POST /api/webhooks/stripe
       marks the order paid (once — repeat deliveries are ignored)
       creates the Packeta packet   → appears in your client zone, ready to print
       sends the confirmation email
  → /api/cron/sync-shipments (hourly)
       notices the Packeta status changed → sends the "on the way" email with tracking
```

A Packeta or email failure never rolls back a paid order: the failure is recorded on the
order row (`packeta_error`) and logged, so it can be retried by hand.
