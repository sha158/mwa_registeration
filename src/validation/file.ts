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
