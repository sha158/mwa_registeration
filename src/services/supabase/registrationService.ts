import { deriveAvailability } from '@/domain/availability'
import { getSupabase } from '@/lib/supabase'
import type { MemberNumber } from '@/types/domain'
import type { RegistrationService } from '../types'
import { toServiceError } from './errors'
import { memberToRpc, submitResultFromRpc } from './mappers'

export const supabaseRegistrationService: RegistrationService = {
  async getAvailability() {
    const { data, error } = await getSupabase().rpc('get_registration_availability')
    if (error) throw toServiceError(error)
    const o = (data ?? {}) as Record<string, unknown>
    return deriveAvailability(
      { registrationOpen: o.registration_open === true, maximumTeams: Number(o.maximum_teams ?? 0) },
      Number(o.registered_teams ?? 0),
    )
  },

  async submitRegistration({ submissionId, members, consent }) {
    try {
      const { data, error } = await getSupabase().rpc('register_team', {
        p_submission_id: submissionId,
        p_members: members.map((m, i) => memberToRpc(m, (i + 1) as MemberNumber)),
        p_consent: { eligibility: consent.eligibility, accuracy: consent.accuracy, data_use: consent.dataUse },
      })
      if (error) {
        return toServiceError(error).code === 'NETWORK_ERROR'
          ? { ok: false, error: 'NETWORK_ERROR' }
          : { ok: false, error: 'UNKNOWN' }
      }
      return submitResultFromRpc(data)
    } catch {
      return { ok: false, error: 'NETWORK_ERROR' }
    }
  },
}
