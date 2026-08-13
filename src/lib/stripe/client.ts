import Stripe from 'stripe'
import { ENV, requireEnv } from '@/lib/env'

let client: Stripe | null = null

/** Created lazily so a build without secrets present does not fail. */
export function stripeClient(): Stripe {
  if (!client) {
    client = new Stripe(requireEnv(ENV.stripeSecretKey))
  }
  return client
}
