import { describe, expect, it } from 'vitest'
import { likelyAadhaarPdfPassword } from './aadhaarPassword'

describe('likelyAadhaarPdfPassword', () => {
  it('uses the first four letters in capitals and the birth year', () => {
    expect(likelyAadhaarPdfPassword('Mohammed Rafiq', '2004-05-10')).toBe('MOHA2004')
  })

  it('skips spaces, dots and initials punctuation', () => {
    expect(likelyAadhaarPdfPassword('A. K. Faizal', '2001-01-31')).toBe('AKFA2001')
  })

  it('uses the whole name when it is shorter than four letters', () => {
    expect(likelyAadhaarPdfPassword('Ali', '2003-12-01')).toBe('ALI2003')
  })

  it('returns null for an invalid date or a name without letters', () => {
    expect(likelyAadhaarPdfPassword('Ali', '2003-02-30')).toBeNull()
    expect(likelyAadhaarPdfPassword(' . ', '2003-02-01')).toBeNull()
  })
})
