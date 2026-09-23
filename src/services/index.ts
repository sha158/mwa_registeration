/**
 * Service wiring — the single place to swap mock implementations for Supabase ones, e.g.
 *   export const registrationService = supabaseRegistrationService
 */
import { mockAdminService } from './mock/mockAdminService'
import { mockAuthService } from './mock/mockAuthService'
import { mockDocumentService } from './mock/mockDocumentService'
import { mockExportService } from './mock/mockExportService'
import { mockRegistrationService } from './mock/mockRegistrationService'
import type { AdminService, AuthService, DocumentService, ExportService, RegistrationService } from './types'

export const registrationService: RegistrationService = mockRegistrationService
export const documentService: DocumentService = mockDocumentService
export const adminService: AdminService = mockAdminService
export const authService: AuthService = mockAuthService
export const exportService: ExportService = mockExportService

export { ServiceError } from './types'
export type { SignedDocumentUrl, TeamQuery } from './types'
