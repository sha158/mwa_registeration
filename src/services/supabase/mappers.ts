import { AGE_MESSAGE } from '@/domain/age'
import { ELIGIBILITY_MESSAGES } from '@/domain/eligibility'
import type {
  AadhaarDocuments,
  DashboardStats,
  DocumentRef,
  District,
  MemberInput,
  MemberNumber,
  SubmitResult,
  Team,
  TeamMember,
} from '@/types/domain'
import type { Database, Json } from './database.types'

/**
 * Translation between database rows / RPC payloads (snake_case) and domain types.
 * Nothing outside src/services/supabase sees column names or database error codes.
 */

type MemberRow = Database['public']['Tables']['team_members']['Row']
type TeamRow = Database['public']['Tables']['teams']['Row'] & { team_members: MemberRow[] }

const isMemberNumber = (n: unknown): n is MemberNumber => n === 1 || n === 2 || n === 3

function asObject(value: Json | null): Record<string, Json | undefined> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

// ---------- rows → domain ----------

export function memberFromRow(row: MemberRow): TeamMember {
  const base = {
    id: row.id,
    teamId: row.team_id,
    memberNumber: isMemberNumber(row.member_number) ? row.member_number : 1,
    fullName: row.full_name,
    mobileNumber: row.mobile_number,
    dateOfBirth: row.date_of_birth,
    residentialAddress: row.residential_address,
    district: row.district as District,
    studyingInMadrasa: row.studying_in_madrasa,
    isAalim: row.is_aalim,
    aadhaar: aadhaarFromRow(row),
  }
  return row.participant_status === 'student'
    ? { ...base, participantStatus: 'student', courseDetails: row.course_details ?? '', institution: row.institution ?? '' }
    : { ...base, participantStatus: 'working', occupation: row.occupation ?? '', employer: row.employer ?? '' }
}

/** No back side means the front is the e-Aadhaar PDF (enforced by a table constraint). */
function aadhaarFromRow(row: MemberRow): AadhaarDocuments {
  const front: DocumentRef = {
    uploadId: row.aadhaar_storage_path,
    fileName: row.aadhaar_file_name,
    sizeBytes: row.aadhaar_size_bytes,
    mimeType: row.aadhaar_mime_type,
  }
  if (row.aadhaar_back_storage_path === null) return { kind: 'pdf', file: front }
  return {
    kind: 'photos',
    front,
    back: {
      uploadId: row.aadhaar_back_storage_path,
      fileName: row.aadhaar_back_file_name ?? '',
      sizeBytes: row.aadhaar_back_size_bytes ?? 0,
      mimeType: row.aadhaar_back_mime_type ?? undefined,
    },
  }
}

export function teamFromRow(row: TeamRow): Team {
  return {
    id: row.id,
    registrationNumber: row.registration_number,
    status: row.status,
    createdAt: row.created_at,
    adminNote: row.admin_note ?? undefined,
    members: row.team_members.map(memberFromRow).sort((a, b) => a.memberNumber - b.memberNumber),
  }
}

export function statsFromRpc(value: Json | null): DashboardStats {
  const o = asObject(value)
  return {
    registeredTeams: Number(o.registered_teams ?? 0),
    maximumTeams: Number(o.maximum_teams ?? 0),
    participants: Number(o.participants ?? 0),
    slotsRemaining: Number(o.slots_remaining ?? 0),
    pendingVerification: Number(o.pending_verification ?? 0),
  }
}

// ---------- domain → RPC ----------

export function memberToRpc(member: MemberInput, memberNumber: MemberNumber): Json {
  const student = member.participantStatus === 'student'
  const { aadhaar } = member
  const front = aadhaar.kind === 'photos' ? aadhaar.front : aadhaar.file
  const back = aadhaar.kind === 'photos' ? aadhaar.back : null
  return {
    member_number: memberNumber,
    full_name: member.fullName,
    mobile_number: member.mobileNumber,
    date_of_birth: member.dateOfBirth,
    residential_address: member.residentialAddress,
    district: member.district,
    participant_status: member.participantStatus,
    course_details: student ? member.courseDetails : null,
    institution: student ? member.institution : null,
    occupation: student ? null : member.occupation,
    employer: student ? null : member.employer,
    studying_in_madrasa: member.studyingInMadrasa,
    is_aalim: member.isAalim,
    aadhaar_storage_path: front.uploadId,
    aadhaar_file_name: front.fileName,
    aadhaar_back_storage_path: back?.uploadId ?? null,
    aadhaar_back_file_name: back?.fileName ?? null,
  }
}

// ---------- register_team result → SubmitResult ----------

const FIELD_MESSAGES: Record<string, string> = {
  date_of_birth: AGE_MESSAGE,
  district: 'Participants must be residents of Dakshina Kannada or Udupi.',
  studying_in_madrasa: ELIGIBILITY_MESSAGES.madrasa,
  is_aalim: ELIGIBILITY_MESSAGES.aalim,
  full_name: 'Please check the full name.',
  mobile_number: 'Please check the mobile number.',
  residential_address: 'Please check the residential address.',
  participant_status: 'Please complete the education or work details.',
  eligibility: 'Please answer the eligibility questions.',
}

export function submitResultFromRpc(value: Json | null): SubmitResult {
  const o = asObject(value)
  if (o.ok === true) {
    return {
      ok: true,
      registrationNumber: String(o.registration_number),
      memberNames: Array.isArray(o.member_names) ? o.member_names.map(String) : [],
      submittedAt: String(o.submitted_at),
    }
  }
  const memberNumber = isMemberNumber(o.member_number) ? o.member_number : undefined
  const prefix = memberNumber ? `Member ${memberNumber}: ` : ''
  switch (o.error) {
    case 'REGISTRATION_FULL':
    case 'REGISTRATION_CLOSED':
      return { ok: false, error: o.error }
    case 'DUPLICATE_PARTICIPANT': {
      const numbers = Array.isArray(o.member_numbers) ? o.member_numbers.filter(isMemberNumber) : []
      return { ok: false, error: 'DUPLICATE_PARTICIPANT', memberNumbers: numbers }
    }
    case 'INVALID_DOCUMENT': {
      const what = o.side === 'back' ? 'The back of the Aadhaar' : 'The Aadhaar upload'
      return {
        ok: false,
        error: 'VALIDATION_FAILED',
        memberNumber,
        message: `${prefix}${what} could not be verified. Please upload it again.`,
      }
    }
    case 'INVALID_ELIGIBILITY':
    case 'INVALID_INPUT': {
      const field = typeof o.field === 'string' ? o.field : ''
      if (field === 'consent') return { ok: false, error: 'VALIDATION_FAILED', message: 'Please tick all three declarations.' }
      return {
        ok: false,
        error: 'VALIDATION_FAILED',
        memberNumber,
        message: prefix + (FIELD_MESSAGES[field] ?? 'Some details need to be corrected.'),
      }
    }
    case 'INVALID_TEAM_SIZE':
      return { ok: false, error: 'VALIDATION_FAILED', message: 'A team must have exactly 3 members.' }
    default:
      return { ok: false, error: 'UNKNOWN' }
  }
}
