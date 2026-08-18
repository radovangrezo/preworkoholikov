/** Names of every environment variable the shop depends on. */
export const ENV = {
  supabaseUrl: 'SUPABASE_URL',
  supabaseServiceRoleKey: 'SUPABASE_SERVICE_ROLE_KEY',
  stripeSecretKey: 'STRIPE_SECRET_KEY',
  stripeWebhookSecret: 'STRIPE_WEBHOOK_SECRET',
  packetaApiPassword: 'PACKETA_API_PASSWORD',
  packetaEshopName: 'PACKETA_ESHOP_NAME',
  packetaCarrierIdHomeSk: 'PACKETA_CARRIER_ID_HOME_SK',
  packetaCarrierIdHomeCz: 'PACKETA_CARRIER_ID_HOME_CZ',
  printfulAccessKey: 'PRINTFUL_ACCESS_KEY',
  resendApiKey: 'RESEND_API_KEY',
  orderEmailFrom: 'ORDER_EMAIL_FROM',
  orderEmailBcc: 'ORDER_EMAIL_BCC',
  cronSecret: 'CRON_SECRET',
} as const

/** Reads a required variable, failing loudly instead of silently misbehaving. */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined
}
