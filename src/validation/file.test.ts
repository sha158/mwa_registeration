import { describe, expect, it } from 'vitest'
import { checkAadhaarContents, detectAadhaarType, validateAadhaarFile } from './file'

const file = (bytes: number[], name: string, type = '') => new File([new Uint8Array(bytes)], name, { type })

describe('Aadhaar file checks', () => {
  it('detects real JPEG, PNG and PDF signatures', async () => {
    expect(await detectAadhaarType(file([0xff, 0xd8, 0xff, 0xe0], 'a.jpg'))).toBe('image/jpeg')
    expect(await detectAadhaarType(file([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'a.png'))).toBe('image/png')
    expect(await detectAadhaarType(file([...'%PDF-1.7'].map((c) => c.charCodeAt(0)), 'a.pdf'))).toBe('application/pdf')
  })

  it('rejects a renamed file whose contents are not an allowed type', async () => {
    const fake = file([...'hello'].map((c) => c.charCodeAt(0)), 'aadhaar.pdf', 'application/pdf')
    expect(validateAadhaarFile(fake, 'pdf')).toBeNull()
    expect(await detectAadhaarType(fake)).toBeNull()
    expect(await checkAadhaarContents(fake, 'pdf')).toMatch(/not a valid PDF/)
  })

  it('accepts only photos in photo slots and only PDFs in the e-Aadhaar slot', async () => {
    const jpeg = file([0xff, 0xd8, 0xff, 0xe0], 'front.jpg', 'image/jpeg')
    const pdf = file([...'%PDF-1.7'].map((c) => c.charCodeAt(0)), 'e-aadhaar.pdf', 'application/pdf')
    expect(validateAadhaarFile(jpeg, 'photo')).toBeNull()
    expect(validateAadhaarFile(pdf, 'photo')).toBe('Please upload a JPG or PNG file.')
    expect(validateAadhaarFile(jpeg, 'pdf')).toBe('Please upload a PDF file.')
    expect(await checkAadhaarContents(jpeg, 'photo')).toBeNull()
    expect(await checkAadhaarContents(pdf, 'pdf')).toBeNull()
    // A PDF renamed to .jpg is caught by its contents.
    expect(await checkAadhaarContents(file([...'%PDF-1.7'].map((c) => c.charCodeAt(0)), 'x.jpg'), 'photo')).not.toBeNull()
  })
})
