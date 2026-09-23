import { AADHAAR_FILE } from '@/config/event'

const MAX_MB = AADHAAR_FILE.maxBytes / (1024 * 1024)

/** Returns a user-facing error, or null when the file is acceptable. */
export function validateAadhaarFile(file: File): string | null {
  const name = file.name.toLowerCase()
  const typeOk =
    (AADHAAR_FILE.mimeTypes as readonly string[]).includes(file.type) ||
    AADHAAR_FILE.extensions.some((ext) => name.endsWith(ext))
  if (!typeOk) return 'Please upload a JPG, PNG or PDF file.'
  if (file.size === 0) return 'This file appears to be empty. Please choose another file.'
  if (file.size > AADHAAR_FILE.maxBytes) return `File is too large. Maximum size is ${MAX_MB} MB.`
  return null
}

export const AADHAAR_ACCEPT = [...AADHAAR_FILE.mimeTypes, ...AADHAAR_FILE.extensions].join(',')

export type AadhaarMimeType = (typeof AADHAAR_FILE.mimeTypes)[number]

const SIGNATURES: { type: AadhaarMimeType; bytes: number[] }[] = [
  { type: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { type: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }, // %PDF-
]

/** Detects JPEG / PNG / PDF from the file's first bytes rather than its name or reported type. */
export async function detectAadhaarType(file: Blob): Promise<AadhaarMimeType | null> {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  return SIGNATURES.find((sig) => sig.bytes.every((b, i) => head[i] === b))?.type ?? null
}

export const AADHAAR_EXTENSION: Record<AadhaarMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
}
