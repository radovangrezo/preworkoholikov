import manifest from './pages.json'

/**
 * The pages of the printed sample, as pictures. Both this list and the pictures come from
 * `npm run book:sample`, so a new sample PDF is a single command and never an edit here.
 */
export const SAMPLE_PAGES = manifest.files.map((file, index) => ({
  src: `${manifest.dir}/${file}`,
  /** Position in the sample, not the page number printed in the book. */
  number: index + 1,
}))

/** Every page is rendered at the same size, so one description covers them all. */
export const SAMPLE_PAGE_SIZE = { width: manifest.width, height: manifest.height }
