import { parseIsoDate } from './age'

/**
 * UIDAI e-Aadhaar PDFs are protected with the first four letters of the name (capitals)
 * followed by the year of birth. Shown to admins as a hint; the file itself is never decrypted here.
 */
export function likelyAadhaarPdfPassword(fullName: string, dateOfBirth: string): string | null {
  const letters = fullName.replace(/[^\p{L}]/gu, '').slice(0, 4).toUpperCase()
  const dob = parseIsoDate(dateOfBirth)
  if (!letters || !dob) return null
  return `${letters}${dob.y}`
}
