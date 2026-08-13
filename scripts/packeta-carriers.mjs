/**
 * Prints the Packeta home-delivery carrier IDs you need for
 * PACKETA_CARRIER_ID_HOME_SK and PACKETA_CARRIER_ID_HOME_CZ.
 *
 * Usage:  npm run packeta:carriers
 * (reads NEXT_PUBLIC_PACKETA_API_KEY from .env.local)
 */

const API_KEY = process.env.NEXT_PUBLIC_PACKETA_API_KEY
const COUNTRIES = ['sk', 'cz']

if (!API_KEY) {
  console.error('NEXT_PUBLIC_PACKETA_API_KEY is empty in .env.local.')
  console.error('Add your 16-character Packeta API key there, then run this again.')
  process.exit(1)
}

const url = `https://www.zasilkovna.cz/api/v4/${API_KEY}/branch.json?address-delivery`
const response = await fetch(url)

if (!response.ok) {
  console.error(`Packeta returned HTTP ${response.status}. Check that the API key is correct.`)
  process.exit(1)
}

const payload = await response.json()
// The feed returns carriers as an object keyed by id, with string "true"/"false" flags.
const carriers = Object.values(payload.carriers ?? {})

if (carriers.length === 0) {
  console.error('The feed contained no carriers. Check the API key.')
  process.exit(1)
}

const isHomeDelivery = (carrier) => carrier.pickupPoints === 'false'
const isUsable = (carrier) => carrier.apiAllowed === 'true' && carrier.available === 'true'

const relevant = carriers.filter(
  (carrier) => COUNTRIES.includes(String(carrier.country).toLowerCase()) && isHomeDelivery(carrier),
)

const usable = relevant.filter(isUsable)

console.log('Home-delivery carriers you can use via the API:\n')
for (const carrier of usable) {
  const country = String(carrier.country).toUpperCase()
  const variable = country === 'SK' ? 'PACKETA_CARRIER_ID_HOME_SK' : 'PACKETA_CARRIER_ID_HOME_CZ'
  console.log(`  ${variable}=${carrier.id}`)
  console.log(`      ${carrier.name}  (max ${carrier.maxWeight} kg, ${carrier.currency})\n`)
}

const unusable = relevant.filter((carrier) => !isUsable(carrier))
if (unusable.length > 0) {
  console.log('Not available through the API (listed so they are not mistaken for options):')
  for (const carrier of unusable) {
    const reason = carrier.apiAllowed !== 'true' ? 'apiAllowed=false' : 'not available'
    console.log(`  id=${carrier.id}  ${carrier.name} — ${reason}`)
  }
}

if (usable.length === 0) {
  console.log('\nNo usable home-delivery carrier found. Ask e-commerce.support@packeta.com')
  console.log('which carrier IDs your account should use for address delivery.')
}
