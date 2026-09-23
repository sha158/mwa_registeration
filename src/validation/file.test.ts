import { describe, expect, it } from 'vitest'
import { detectAadhaarType, validateAadhaarFile } from './file'

const file = (bytes: number[], name: string, type = '') => new File([new Uint8Array(bytes)], name, { type })

describe('Aadhaar file checks', () => {
  it('detects real JPEG, PNG and PDF signatures', async () => {
    expect(await detectAadhaarType(file([0xff, 0xd8, 0xff, 0xe0], 'a.jpg'))).toBe('image/jpeg')
    expect(await detectAadhaarType(file([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'a.png'))).toBe('image/png')
    expect(await detectAadhaarType(file([...'%PDF-1.7'].map((c) => c.charCodeAt(0)), 'a.pdf'))).toBe('application/pdf')
  })

  it('rejects a renamed file whose contents are not an allowed type', async () => {
    const fake = file([...'hello'].map((c) => c.charCodeAt(0)), 'aadhaar.pdf', 'application/pdf')
    expect(validateAadhaarFile(fake)).toBeNull()
    expect(await detectAadhaarType(fake)).toBeNull()
  })
})
