import { getSupabase } from '@/lib/supabase'
import { AADHAAR_EXTENSION, detectAadhaarType } from '@/validation/file'
import { ServiceError, type DocumentService } from '../types'
import { toServiceError } from './errors'

export const AADHAAR_BUCKET = 'aadhaar-documents'
/** Signed URLs live just long enough to open the document. */
const SIGNED_URL_TTL_SECONDS = 120

export const supabaseDocumentService: DocumentService = {
  async uploadAadhaar(file, { submissionId, memberNumber }) {
    // Content type comes from the file's bytes, not its name or the browser-reported type.
    const type = await detectAadhaarType(file)
    if (!type) throw new ServiceError('UPLOAD_FAILED')
    const path = `submissions/${submissionId}/member-${memberNumber}/${crypto.randomUUID()}.${AADHAAR_EXTENSION[type]}`
    const { error } = await getSupabase()
      .storage.from(AADHAAR_BUCKET)
      .upload(path, file, { contentType: type, upsert: false })
    if (error) throw new ServiceError('UPLOAD_FAILED')
    return { uploadId: path, fileName: file.name, sizeBytes: file.size, mimeType: type }
  },

  async getSignedUrl(path) {
    const supabase = getSupabase()
    const { data, error } = await supabase.storage.from(AADHAAR_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
    if (error) throw error.message?.toLowerCase().includes('not found') ? new ServiceError('NOT_FOUND') : toServiceError(error)
    // Fetch once and hand the viewer a same-origin object URL; nothing is cached or persisted.
    const response = await fetch(data.signedUrl)
    if (!response.ok) throw new ServiceError(response.status === 404 ? 'NOT_FOUND' : 'UNKNOWN')
    const url = URL.createObjectURL(await response.blob())
    return {
      url,
      expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
      release: () => URL.revokeObjectURL(url),
    }
  },
}
