/**
 * Downloads extra mockup views for every merch product from Printful's mockup generator,
 * saves them under public/images/merch/ and writes the manifest the shop reads.
 *
 * Usage:  npm run merch:mockups              (every product in the store)
 *         npm run merch:mockups -- 12345    (only the products whose ids are given)
 * (reads PRINTFUL_ACCESS_KEY from .env.local)
 *
 * The generator hands back temporary URLs that stop working after a few days, so the
 * images are downloaded once and committed. Re-run this after changing a design in
 * Printful or adding a product.
 */

import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ACCESS_KEY = process.env.PRINTFUL_ACCESS_KEY
const API = 'https://api.printful.com'

const IMAGE_DIR = 'public/images/merch'
const IMAGE_URL_PREFIX = '/images/merch'
const MANIFEST_PATH = 'src/lib/merch/extra-mockups.ts'
const MOCKUP_FORMAT = 'jpg'

/**
 * Length of the content hash in each file name. A regenerated picture keeps its name
 * only while its bytes are unchanged, so a genuinely new picture arrives on a new URL.
 * Without that, Next's image optimizer goes on serving the picture it cached under the
 * old name — and it caches one entry per width, so a stale main image can sit next to a
 * fresh thumbnail of the same file.
 */
const CONTENT_HASH_LENGTH = 8

/** How many extra views the gallery shows beside the variant's own mockup. */
const EXTRAS_PER_COLOR = 2

/**
 * Styles asked for per product. More than we keep, because a style sometimes offers
 * nothing but views of a side we do not print on.
 */
const STYLES_REQUESTED = EXTRAS_PER_COLOR + 3

/**
 * Printful mockup styles we want, best first. Every product offers a different set, so
 * each one uses the first styles it actually supports.
 *
 * Printful's "Product details" and "Zoomed in" styles are deliberately absent: they
 * frame the manufacturer's own labels and stitching, and on a small chest print they
 * crop our artwork away entirely. So are the plain "Women's" and "Men's" styles, which
 * are what Printful tends to pick for a product's own mockup — asking for them again
 * just repeats the first picture of the gallery.
 *
 * Styles that show clothing with nobody in it rank above the ones with a model, because
 * a garment's own mockup is already someone wearing it, and a shopper wants to see the
 * thing itself as well.
 */
const STYLE_PREFERENCE = [
  'Lifestyle',
  'Baby Lifestyle',
  'Flat Lifestyle',
  'Ghost',
  'On Hanger',
  'Hanger',
  'Folded',
  'Lifestyle 2',
  'Lifestyle 3',
  'Environment',
  "Women's Lifestyle",
  "Men's Lifestyle",
  'Flat',
]

/**
 * Views of a side we never print on, which would show the product looking blank. Every
 * design in the shop is a single front print; printing on the back too would mean
 * letting those views back in.
 */
const HIDDEN_VIEWS = [
  'Back',
  'Back 2',
  'Left',
  'Right',
  'Left sleeve',
  'Right sleeve',
  'Inside label',
  'Outside label',
]

/** Printful finishes most tasks in seconds; give up rather than poll forever. */
const POLL_INTERVAL_MS = 3000
const POLL_ATTEMPTS = 20

/**
 * The mockup generator allows only ten calls a minute and generating every product needs
 * far more, so a rejected call waits out the limit and tries again. A run makes enough
 * requests that the odd dropped connection is normal too, and a product that gave up
 * halfway would leave the manifest disagreeing with the images on disk.
 */
const RATE_LIMITED_STATUS = 429
const RETRIES = 5
const RETRY_PAUSE_SECONDS = 5
const RATE_LIMIT_FALLBACK_SECONDS = 60

/** Manifest key for variants that carry no colour. Mirrored in src/lib/merch/gallery.ts. */
const NO_COLOR_KEY = ''

/** Products named on the command line; everything in the store when there are none. */
const ONLY = process.argv.slice(2).map(Number)

if (ONLY.some((id) => !Number.isInteger(id) || id <= 0)) {
  console.error(`Product ids must be whole numbers: ${process.argv.slice(2).join(' ')}`)
  process.exit(1)
}

if (!ACCESS_KEY) {
  console.error('PRINTFUL_ACCESS_KEY is empty in .env.local.')
  process.exit(1)
}

/** Rides out a dropped connection or the per-minute limit; anything else is the caller's. */
async function request(url, init = {}) {
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    let response = null

    try {
      response = await fetch(url, init)
    } catch {
      console.log(`  no response, retrying in ${RETRY_PAUSE_SECONDS}s`)
      await pause(RETRY_PAUSE_SECONDS * 1000)
      continue
    }

    if (response.status !== RATE_LIMITED_STATUS) return response

    const seconds = await retryAfterSeconds(response)
    console.log(`  rate limited, waiting ${seconds}s`)
    await pause(seconds * 1000)
  }

  throw new Error(`${url} kept failing`)
}

/** Printful states the wait in a header on some endpoints and in the message on others. */
async function retryAfterSeconds(response) {
  const header = Number(response.headers.get('retry-after'))
  if (Number.isFinite(header) && header > 0) return header

  const payload = await response.json().catch(() => null)
  const stated = payload?.error?.message?.match(/(\d+) seconds?/)
  return stated ? Number(stated[1]) : RATE_LIMIT_FALLBACK_SECONDS
}

async function api(endpoint, options = {}) {
  const response = await request(`${API}${endpoint}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${ACCESS_KEY}`,
      'Content-Type': 'application/json',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.error?.message ?? `HTTP ${response.status}`
    throw new Error(`Printful ${endpoint} failed: ${message}`)
  }

  return payload?.result
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The print files the generator needs, taken from what the store product already has.
 * Sync variants name their single placement "default", which not every product accepts
 * as a placement, so unknown names fall back to the product's first real one.
 */
function printFiles(variant, placements) {
  const names = Object.keys(placements ?? {})

  return (variant.files ?? [])
    .filter((file) => file.type !== 'preview' && file.preview_url)
    .map((file) => ({
      placement: names.includes(file.type) ? file.type : names[0],
      image_url: file.preview_url,
      position: {
        area_width: file.width,
        area_height: file.height,
        width: file.width,
        height: file.height,
        top: 0,
        left: 0,
      },
    }))
}

async function waitForTask(taskKey) {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    const task = await api(`/mockup-generator/task?task_key=${taskKey}`)
    if (task.status === 'completed') return task.mockups ?? []
    if (task.status === 'failed') throw new Error(task.error ?? 'the mockup task failed')
    await pause(POLL_INTERVAL_MS)
  }

  throw new Error('the mockup task did not finish in time')
}

/**
 * One URL per style for a single catalog variant, in our order of preference, so the
 * extras differ from each other rather than showing the same product from near-identical
 * angles.
 *
 * Only the views listed under `extra` are used. The task's top-level mockup is one more
 * view of the same product, but it is the only one that arrives without saying which
 * style it belongs to, and Printful returns the styles in its own order rather than the
 * order they were asked for — so there is no way to tell what it is a picture of.
 */
function styleUrls(mockups, catalogVariantId, styles) {
  const views = mockups
    .filter((mockup) => mockup.variant_ids?.includes(catalogVariantId))
    .flatMap((mockup) => mockup.extra ?? [])
    .filter((view) => view.url && !HIDDEN_VIEWS.includes(view.option))

  return styles
    .map((style) => views.find((view) => view.option_group === style)?.url)
    .filter((url) => url !== undefined)
    .slice(0, EXTRAS_PER_COLOR)
}

function colorSlug(color) {
  return (color ?? 'default')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function download(url) {
  const response = await request(url)
  if (!response.ok) throw new Error(`could not download ${url}: HTTP ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

function contentHash(bytes) {
  return createHash('sha256').update(bytes).digest('hex').slice(0, CONTENT_HASH_LENGTH)
}

/** Extra views for one store product, keyed by variant colour. */
async function collectProduct(productId) {
  const { sync_product: product, sync_variants: variants } = await api(
    `/store/products/${productId}`,
  )

  const catalogProductId = variants[0]?.product?.product_id
  if (!catalogProductId) throw new Error('the product has no variants')

  const { available_placements: placements, option_groups: available } = await api(
    `/mockup-generator/printfiles/${catalogProductId}`,
  )

  const styles = STYLE_PREFERENCE.filter((style) => available.includes(style)).slice(
    0,
    STYLES_REQUESTED,
  )

  if (styles.length === 0) {
    console.log(`  ${product.name}: Printful offers none of the styles we ask for, skipped`)
    return {}
  }

  const task = await api(`/mockup-generator/create-task/${catalogProductId}`, {
    method: 'POST',
    body: {
      variant_ids: [...new Set(variants.map((variant) => variant.variant_id))],
      format: MOCKUP_FORMAT,
      option_groups: styles,
      files: printFiles(variants[0], placements),
    },
  })

  const mockups = await waitForTask(task.task_key)
  const directory = path.join(IMAGE_DIR, String(productId))
  await rm(directory, { recursive: true, force: true })
  await mkdir(directory, { recursive: true })

  const byColor = {}

  // One variant per colour is enough: sizes of the same colour share a mockup.
  for (const variant of variants) {
    const key = variant.color ?? NO_COLOR_KEY
    if (byColor[key]) continue

    const urls = styleUrls(mockups, variant.variant_id, styles)
    if (urls.length === 0) continue

    byColor[key] = []
    for (const [index, url] of urls.entries()) {
      const bytes = await download(url)
      const name = `${colorSlug(variant.color)}-${index + 1}-${contentHash(bytes)}.${MOCKUP_FORMAT}`
      await writeFile(path.join(directory, name), bytes)
      byColor[key].push(`${IMAGE_URL_PREFIX}/${productId}/${name}`)
    }
  }

  const total = Object.values(byColor).reduce((sum, urls) => sum + urls.length, 0)
  console.log(`  ${product.name}: ${total} images, asked for ${styles.join(', ')}`)

  return byColor
}

/**
 * The manifest as it stands. A run for a single product merges into this, so every other
 * product keeps the pictures it already has. Read out of the generated file rather than
 * imported, because Node cannot import TypeScript.
 */
async function existingManifest() {
  const source = await readFile(MANIFEST_PATH, 'utf8').catch(() => '')
  const object = source.slice(source.indexOf('{'), source.lastIndexOf('}') + 1)

  try {
    return JSON.parse(object)
  } catch {
    return {}
  }
}

/**
 * Pictures of a product the shop no longer sells. The manifest is written from scratch,
 * so anything it stopped mentioning is dead weight in the repository.
 */
async function removeUnusedDirectories(manifest) {
  const directories = await readdir(IMAGE_DIR).catch(() => [])

  for (const name of directories) {
    if (manifest[name]) continue
    await rm(path.join(IMAGE_DIR, name), { recursive: true, force: true })
    console.log(`  removed ${IMAGE_DIR}/${name}, no longer in the shop`)
  }
}

function manifestSource(manifest) {
  return `/**
 * Extra mockup views for each merch product, by variant colour. Generated by
 * \`npm run merch:mockups\` — change the products in Printful and re-run it rather than
 * editing this file by hand.
 */
export const MERCH_EXTRA_MOCKUPS: Record<string, Record<string, string[]>> = ${JSON.stringify(
    manifest,
    null,
    2,
  )}
`
}

// Products removed from the store keep coming back from Printful, only flagged as
// ignored. The shop does not sell them, so they get no pictures either.
const inStore = (await api('/store/products')).filter((summary) => !summary.is_ignored)
const summaries = ONLY.length === 0 ? inStore : inStore.filter((s) => ONLY.includes(s.id))

const missing = ONLY.filter((id) => !summaries.some((summary) => summary.id === id))
if (missing.length > 0) {
  console.error(`Not in the store: ${missing.join(', ')}`)
  process.exit(1)
}

console.log(`Generating mockups for ${summaries.length} products.\n`)

const manifest = ONLY.length === 0 ? {} : await existingManifest()
const failed = []

for (const summary of summaries) {
  try {
    const byColor = await collectProduct(summary.id)
    if (Object.keys(byColor).length > 0) manifest[String(summary.id)] = byColor
  } catch (error) {
    console.error(`  ${summary.name}: ${error.message}`)
    failed.push(summary.name)
  }
}

await writeFile(MANIFEST_PATH, manifestSource(manifest))
await removeUnusedDirectories(manifest)
console.log(`\nWrote ${MANIFEST_PATH}. Commit it together with ${IMAGE_DIR}.`)

// The manifest is rewritten from scratch, so a product that failed has quietly lost its
// pictures while its files sit on disk unreferenced. Say so, and run it again.
if (failed.length > 0) {
  console.error(`\n${failed.join(', ')} produced nothing. Run this again before committing.`)
  process.exit(1)
}
