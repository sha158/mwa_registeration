import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { LIMITS } from '@/config/event'
import type { MemberNumber, SubmitResult } from '@/types/domain'
import { createMemberSchema, type MemberFormValues } from '@/validation/memberSchema'

export type RegistrationSuccess = Extract<SubmitResult, { ok: true }>

interface RegistrationState {
  /** Random id for this draft. Scopes Aadhaar uploads and makes submission idempotent. */
  submissionId: string
  members: Partial<Record<MemberNumber, MemberFormValues>>
  success: RegistrationSuccess | null
  saveMember: (n: MemberNumber, values: MemberFormValues) => void
  completeRegistration: (result: RegistrationSuccess) => void
  startOver: () => void
}

/**
 * Draft of the team being registered.
 *
 * Persistence is deliberate and narrow: sessionStorage (cleared when the tab closes) so a
 * mobile browser reload does not wipe the form. It holds typed text fields, the draft id and the opaque
 * Aadhaar upload reference (storage path, file name, size) — never file contents or URLs.
 * The draft is cleared as soon as the registration is submitted.
 */
export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set) => ({
      submissionId: crypto.randomUUID(),
      members: {},
      success: null,
      saveMember: (n, values) => set((s) => ({ members: { ...s.members, [n]: values }, success: null })),
      completeRegistration: (result) => set({ submissionId: crypto.randomUUID(), members: {}, success: result }),
      startOver: () => set({ submissionId: crypto.randomUUID(), members: {}, success: null }),
    }),
    {
      name: 'mwa.registrationDraft',
      version: 2,
      // v1 drafts had no submission id and mock-only upload references: start fresh.
      migrate: () => ({ submissionId: crypto.randomUUID(), members: {}, success: null }),
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ submissionId: s.submissionId, members: s.members, success: s.success }),
    },
  ),
)

export const MEMBER_NUMBERS: MemberNumber[] = [1, 2, 3]

export function isMemberNumber(value: number): value is MemberNumber {
  return Number.isInteger(value) && value >= 1 && value <= LIMITS.teamSize
}

/** Mobiles entered for the other members, used to prevent duplicates within a team. */
export function otherMobiles(members: RegistrationState['members'], n: MemberNumber): string[] {
  return MEMBER_NUMBERS.filter((m) => m !== n)
    .map((m) => members[m]?.mobileNumber)
    .filter((v): v is string => Boolean(v))
}

export function isMemberComplete(members: RegistrationState['members'], n: MemberNumber): boolean {
  const values = members[n]
  return Boolean(values) && createMemberSchema({ otherMobiles: otherMobiles(members, n) }).safeParse(values).success
}

/** First member step that still needs completing, or null when all three are complete. */
export function firstIncompleteMember(members: RegistrationState['members']): MemberNumber | null {
  return MEMBER_NUMBERS.find((n) => !isMemberComplete(members, n)) ?? null
}
