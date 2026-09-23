/**
 * Service wiring — the single place that chooses implementations.
 *
 * Production and default development builds use Supabase. The in-memory mocks load only in a
 * development build with VITE_USE_MOCKS=true; import.meta.env.DEV is statically false in
 * production builds, so the mock modules are not even bundled.
 */
import { supabaseAdminService } from './supabase/adminService'
import { supabaseAuthService } from './supabase/authService'
import { supabaseDocumentService } from './supabase/documentService'
import { supabaseExportService } from './supabase/exportService'
import { supabaseRegistrationService } from './supabase/registrationService'
import type { AdminService, AuthService, DocumentService, ExportService, RegistrationService } from './types'

export const usingMockServices = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true'

const mocks = usingMockServices ? await import('./mock') : null

export const registrationService: RegistrationService = mocks?.registrationService ?? supabaseRegistrationService
export const documentService: DocumentService = mocks?.documentService ?? supabaseDocumentService
export const adminService: AdminService = mocks?.adminService ?? supabaseAdminService
export const authService: AuthService = mocks?.authService ?? supabaseAuthService
export const exportService: ExportService = mocks?.exportService ?? supabaseExportService

export { ServiceError } from './types'
export type { SignedDocumentUrl, TeamQuery } from './types'
