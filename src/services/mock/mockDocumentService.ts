import { ServiceError, type DocumentService } from '../types'
import { delay, getScenario } from './scenario'

/** Uploaded files live only in memory for the lifetime of the tab. */
const files = new Map<string, File>()
const SIGNED_URL_TTL_MS = 60_000

function placeholderDocument(): Blob {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
<rect width="640" height="400" rx="24" fill="#eff4ff"/>
<text x="320" y="190" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#0d4738">Sample document</text>
<text x="320" y="230" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#404945">Mock data — no real identity document</text>
</svg>`
  return new Blob([svg], { type: 'image/svg+xml' })
}

export const mockDocumentService: DocumentService = {
  async uploadAadhaar(file, { memberNumber }) {
    await delay(900)
    if (getScenario() === 'upload-fail') throw new ServiceError('UPLOAD_FAILED')
    const uploadId = `upload-${memberNumber}-${crypto.randomUUID()}`
    files.set(uploadId, file)
    return { uploadId, fileName: file.name, sizeBytes: file.size, mimeType: file.type }
  },

  async getSignedUrl(uploadId) {
    await delay()
    const blob = files.get(uploadId) ?? (uploadId.startsWith('seed-') ? placeholderDocument() : null)
    if (!blob) throw new ServiceError('NOT_FOUND', 'Document not found')
    const url = URL.createObjectURL(blob)
    const timer = setTimeout(() => URL.revokeObjectURL(url), SIGNED_URL_TTL_MS)
    return {
      url,
      expiresAt: Date.now() + SIGNED_URL_TTL_MS,
      release() {
        clearTimeout(timer)
        URL.revokeObjectURL(url)
      },
    }
  },
}
