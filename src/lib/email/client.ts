import { Resend } from 'resend'
import { ENV, optionalEnv, requireEnv } from '@/lib/env'

let client: Resend | null = null

function resendClient(): Resend {
  if (!client) {
    client = new Resend(requireEnv(ENV.resendApiKey))
  }
  return client
}

export type OutgoingEmail = {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail(email: OutgoingEmail): Promise<void> {
  const bcc = optionalEnv(ENV.orderEmailBcc)

  const { error } = await resendClient().emails.send({
    from: requireEnv(ENV.orderEmailFrom),
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    ...(bcc ? { bcc } : {}),
  })

  if (error) {
    throw new Error(`Could not send email "${email.subject}": ${error.message}`)
  }
}
