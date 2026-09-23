import type {
  AdminSession,
  Availability,
  DashboardStats,
  DocumentRef,
  MemberNumber,
  RegistrationPayload,
  RegistrationSettings,
  RegistrationStatus,
  SubmitResult,
  Team,
} from '@/types/domain'

/**
 * Service contracts. UI code depends only on these interfaces; `services/index.ts` wires the
 * implementation (mock today, Supabase later).
 */

export interface RegistrationService {
  getAvailability(): Promise<Availability>
  /**
   * Transactional on the backend (Supabase RPC `register_team`): re-checks open/capacity,
   * validates members, rejects duplicates, reserves the registration number.
   * Never throws for expected outcomes — returns a SubmitResult.
   */
  submitRegistration(payload: RegistrationPayload): Promise<SubmitResult>
}

export interface SignedDocumentUrl {
  url: string
  expiresAt: number
  /** Release the URL when the viewer closes. */
  release(): void
}

export interface DocumentService {
  /** Uploads to private storage. Returns a reference only — never a public URL. */
  uploadAadhaar(file: File, memberNumber: MemberNumber): Promise<DocumentRef>
  /** Admin only. Short-lived signed URL (Supabase Storage `createSignedUrl`). */
  getSignedUrl(uploadId: string): Promise<SignedDocumentUrl>
}

export interface TeamQuery {
  search?: string
  status?: RegistrationStatus | 'all'
}

export interface AdminService {
  getStats(): Promise<DashboardStats>
  listTeams(query?: TeamQuery): Promise<Team[]>
  getTeam(teamId: string): Promise<Team | null>
  updateTeamStatus(teamId: string, status: RegistrationStatus, note?: string): Promise<Team>
  getSettings(): Promise<RegistrationSettings & { registeredTeams: number }>
  setRegistrationOpen(open: boolean): Promise<void>
}

export interface AuthService {
  getSession(): Promise<AdminSession | null>
  signIn(email: string, password: string): Promise<AdminSession>
  signOut(): Promise<void>
}

export interface ExportService {
  teamsCsv(): Promise<Blob>
  participantsCsv(): Promise<Blob>
}

export type ServiceErrorCode = 'NETWORK_ERROR' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'INVALID_CREDENTIALS' | 'UPLOAD_FAILED'

export class ServiceError extends Error {
  readonly code: ServiceErrorCode
  constructor(code: ServiceErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'ServiceError'
    this.code = code
  }
}
