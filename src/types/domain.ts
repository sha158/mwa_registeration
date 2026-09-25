import type { DISTRICTS } from '@/config/event'

export type District = (typeof DISTRICTS)[number]
export type ParticipantStatus = 'student' | 'working'
export type MemberNumber = 1 | 2 | 3

export type RegistrationStatus = 'submitted' | 'verified' | 'rejected' | 'cancelled'

/** Reference to an uploaded Aadhaar document. Never contains file contents or URLs. */
export interface DocumentRef {
  /** Opaque storage reference (the private storage path). */
  uploadId: string
  fileName: string
  sizeBytes: number
  mimeType?: string
}

/**
 * A member's Aadhaar: photos of both sides, or the official e-Aadhaar PDF (which already shows
 * both sides). The back carries the address.
 */
export type AadhaarDocuments = { kind: 'photos'; front: DocumentRef; back: DocumentRef } | { kind: 'pdf'; file: DocumentRef }

interface MemberBase {
  fullName: string
  mobileNumber: string
  /** ISO date, yyyy-mm-dd */
  dateOfBirth: string
  residentialAddress: string
  district: District
  studyingInMadrasa: boolean
  isAalim: boolean
}

export interface StudentDetails {
  participantStatus: 'student'
  courseDetails: string
  institution: string
}

export interface WorkingDetails {
  participantStatus: 'working'
  occupation: string
  employer: string
}

/** Member data as entered by the registrant (maps to a team_members insert). */
export type MemberInput = MemberBase & (StudentDetails | WorkingDetails) & { aadhaar: AadhaarDocuments }

/** Stored participant (maps to a team_members row). */
export type TeamMember = MemberInput & {
  id: string
  teamId: string
  memberNumber: MemberNumber
}

export interface Team {
  id: string
  registrationNumber: string
  status: RegistrationStatus
  createdAt: string
  /** Admin note, e.g. rejection reason. */
  adminNote?: string
  members: TeamMember[]
}

export interface RegistrationSettings {
  registrationOpen: boolean
  maximumTeams: number
}

export type AvailabilityState = 'open' | 'limited' | 'full' | 'closed'

export interface Availability {
  state: AvailabilityState
  registeredTeams: number
  maximumTeams: number
  slotsRemaining: number
}

export interface RegistrationPayload {
  /** Draft id generated on the device; scopes uploads and makes submission idempotent. */
  submissionId: string
  members: [MemberInput, MemberInput, MemberInput]
  consent: { eligibility: true; accuracy: true; dataUse: true }
}

export type SubmitResult =
  | { ok: true; registrationNumber: string; memberNames: string[]; submittedAt: string }
  | { ok: false; error: 'REGISTRATION_FULL' | 'REGISTRATION_CLOSED' | 'NETWORK_ERROR' | 'UNKNOWN' }
  | { ok: false; error: 'DUPLICATE_PARTICIPANT'; memberNumbers: MemberNumber[] }
  | { ok: false; error: 'VALIDATION_FAILED'; message: string; memberNumber?: MemberNumber }

export type SubmitError = Extract<SubmitResult, { ok: false }>

export interface AdminSession {
  email: string
  displayName: string
}

export interface DashboardStats {
  registeredTeams: number
  maximumTeams: number
  participants: number
  slotsRemaining: number
  pendingVerification: number
}
