/**
 * Seller identification shown on the legal pages and in invoices. Publishing these
 * details is a legal requirement.
 *
 * The seller is established in Czechia, so the legal pages reference Czech law and Czech
 * authorities even though the site and all customer-facing copy are in Slovak.
 */
export const SELLER = {
  name: 'Somebody&Somebody CZ sro',
  address: 'Slezská 93, 130 00 Praha, Česká republika',
  businessId: '09170600',
  taxId: 'CZ09170600',
  vatId: 'CZ09170600',
  registration: 'společnost je zapsaná u Městského soudu v Praze, C 332023',
  email: 'hello@somebodytwice.com',
  phone: '+420 773 633362',
  bankAccount: 'CZ0420100000002601813751',
}

/** Shown to customers as the expected dispatch time. */
export const DISPATCH_TIME = '1–2 pracovné dni od prijatia platby'

/**
 * Date this version of the terms takes effect, as ISO so it stays unambiguous.
 * Bump it whenever the terms change materially.
 */
export const TERMS_EFFECTIVE_DATE = '2026-08-13'

/**
 * Body for out-of-court resolution of consumer disputes. The seller is established in
 * Czechia, so this is the Czech authority rather than the Slovak SOI.
 */
export const SUPERVISORY_AUTHORITY = {
  name: 'Česká obchodní inspekce (ČOI)',
  detail: 'Ústřední inspektorát – oddělení ADR, Štěpánská 44, 110 00 Praha 1',
  email: 'podatelna@coi.cz',
  adrUrl: 'https://coi.gov.cz/informace-o-adr/',
}

/**
 * Data protection supervisory authority for the seller's country of establishment.
 * Customers may also complain to the authority where they live.
 */
export const DATA_PROTECTION_AUTHORITY = {
  name: 'Úřad pro ochranu osobních údajů',
  address: 'Pplk. Sochora 27, 170 00 Praha 7, Česká republika',
  url: 'https://uoou.gov.cz/',
}
