/**
 * Turns the printed sample PDF into the page pictures the site's sample reader shows.
 *
 *   npm run book:sample -- ~/Desktop/Ukazka_Rozpravky_pre_workoholikov.pdf
 *
 * Rendering is done by poppler's pdftocairo (brew install poppler), so this runs on a
 * machine with poppler rather than in the build. The pictures and the manifest it writes
 * are committed; the site never reads the PDF.
 *
 * Pages nothing was printed on — the empty versos a book leaves between stories — are
 * left out, so nobody turns a page in the browser and finds it empty.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

/** Where the pictures land, and the path the browser asks for them by. */
const OUTPUT_DIR = 'public/images/ukazka'
const PUBLIC_DIR = '/images/ukazka'
/** The manifest lives in src/ so it is bundled with the app rather than merely served. */
const MANIFEST_FILE = 'src/lib/sample/pages.json'

/** Rendered well above the width they are shown at, then scaled down, so text stays crisp. */
const RENDER_DPI = 200
const PAGE_WIDTH = 900
const WEBP_QUALITY = 80

function renderToPng(pdfPath, directory) {
  try {
    execFileSync('pdftocairo', ['-png', '-r', String(RENDER_DPI), pdfPath, join(directory, 'page')])
  } catch (error) {
    throw new Error('pdftocairo failed. Is poppler installed? (brew install poppler)', {
      cause: error,
    })
  }

  return readdirSync(directory)
    .sort()
    .map((file) => join(directory, file))
}

/** True for a page with nothing on it: every pixel of it is pure white. */
async function isEmpty(pngPath) {
  const { channels } = await sharp(pngPath).stats()
  return channels.every((channel) => channel.min === 255)
}

function emptyOutputDir() {
  rmSync(OUTPUT_DIR, { recursive: true, force: true })
  mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function main() {
  const pdfPath = process.argv[2]

  if (!pdfPath) {
    console.error('Usage: npm run book:sample -- <path-to-sample.pdf>')
    process.exit(1)
  }

  const scratch = mkdtempSync(join(tmpdir(), 'book-sample-'))

  try {
    const rendered = renderToPng(pdfPath, scratch)
    console.log(`[book-sample] ${rendered.length} pages rendered from ${pdfPath}`)

    emptyOutputDir()
    const files = []
    let size = null

    for (const pngPath of rendered) {
      if (await isEmpty(pngPath)) continue

      const file = `page-${String(files.length + 1).padStart(2, '0')}.webp`
      const { width, height } = await sharp(pngPath)
        .resize({ width: PAGE_WIDTH })
        .webp({ quality: WEBP_QUALITY })
        .toFile(join(OUTPUT_DIR, file))

      files.push(file)
      size = { width, height }
    }

    writeFileSync(MANIFEST_FILE, `${JSON.stringify({ dir: PUBLIC_DIR, ...size, files }, null, 2)}\n`)
    console.log(`[book-sample] ${files.length} pages written to ${OUTPUT_DIR}`)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
