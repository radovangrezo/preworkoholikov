import { ENV, requireEnv } from '@/lib/env'
import type { PacketAttributes } from '@/lib/packeta/packet'

/**
 * Minimal client for Packeta's REST API. Requests are POSTed as an XML document
 * whose root element is the method name; responses carry <status>ok</status> or a
 * fault. Parsed with small helpers rather than pulling in an XML dependency.
 */
const PACKETA_REST_URL = 'https://www.zasilkovna.cz/api/rest'
const REQUEST_TIMEOUT_MS = 15_000

export type CreatedPacket = { packetId: string; barcode: string }
/** codeText is stable across languages, so dispatch logic keys off it rather than statusText. */
export type PacketStatus = { statusCode: string; statusText: string; codeText: string }

export class PacketaError extends Error {}

export async function createPacket(attributes: PacketAttributes): Promise<CreatedPacket> {
  const xml = await call('createPacket', packetAttributesXml(attributes))

  const packetId = readTag(xml, 'id')
  const barcode = readTag(xml, 'barcode')
  if (!packetId) {
    throw new PacketaError('Packeta did not return a packet id')
  }

  return { packetId, barcode: barcode ?? '' }
}

/** Validates attributes without creating anything. Useful for diagnosing setup. */
export async function validatePacketAttributes(attributes: PacketAttributes): Promise<void> {
  await call('packetAttributesValid', packetAttributesXml(attributes))
}

export async function getPacketStatus(packetId: string): Promise<PacketStatus> {
  const xml = await call(
    'packetStatus',
    `<packetId>${escapeXml(packetId)}</packetId>`,
  )

  const codeText = readTag(xml, 'codeText') ?? ''

  return {
    statusCode: readTag(xml, 'statusCode') ?? '',
    statusText: readTag(xml, 'statusText') ?? codeText,
    codeText,
  }
}

async function call(method: string, innerXml: string): Promise<string> {
  const password = requireEnv(ENV.packetaApiPassword)
  const body =
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<${method}><apiPassword>${escapeXml(password)}</apiPassword>${innerXml}</${method}>`

  let response: Response
  try {
    response = await fetch(PACKETA_REST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new PacketaError(`Packeta ${method} request failed: ${describe(error)}`)
  }

  const xml = await response.text()

  if (!response.ok) {
    throw new PacketaError(`Packeta ${method} returned HTTP ${response.status}`)
  }
  if (readTag(xml, 'status') !== 'ok') {
    throw new PacketaError(`Packeta ${method} rejected the request: ${readFault(xml)}`)
  }

  return xml
}

function packetAttributesXml(attributes: PacketAttributes): string {
  const fields = Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `<${key}>${escapeXml(String(value))}</${key}>`)
    .join('')

  return `<packetAttributes>${fields}</packetAttributes>`
}

/** First occurrence of a tag's text content. */
function readTag(xml: string, tag: string): string | null {
  const match = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`).exec(xml)
  return match ? decodeXml(match[1].trim()) : null
}

function readFault(xml: string): string {
  const parts = ['fault', 'string', 'detail']
    .map((tag) => readTag(xml, tag))
    .filter((part): part is string => Boolean(part))

  return parts.length > 0 ? parts.join(' – ') : 'unknown error'
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
