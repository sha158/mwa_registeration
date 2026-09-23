import { deriveAvailability } from '@/domain/availability'
import { matchesTeam } from '@/domain/teamSearch'
import { getSupabase } from '@/lib/supabase'
import type { Team } from '@/types/domain'
import { ServiceError, type AdminService } from '../types'
import { AADHAAR_BUCKET } from './documentService'
import { throwIfRpcFailed, toServiceError } from './errors'
import { statsFromRpc, teamFromRow } from './mappers'

const TEAM_SELECT = '*, team_members(*)'

/**
 * Admin reads rely on RLS (admins only). The whole competition is at most a few dozen rows,
 * so teams are fetched in one query and searched in memory with the shared domain matcher.
 */
async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await getSupabase()
    .from('teams')
    .select(TEAM_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw toServiceError(error)
  return data.map(teamFromRow)
}

async function fetchTeam(teamId: string): Promise<Team | null> {
  const { data, error } = await getSupabase().from('teams').select(TEAM_SELECT).eq('id', teamId).maybeSingle()
  if (error) {
    if (error.code === '22P02') return null // not a UUID
    throw toServiceError(error)
  }
  return data ? teamFromRow(data) : null
}

export const supabaseAdminService: AdminService & { fetchTeams: typeof fetchTeams } = {
  fetchTeams,

  async getStats() {
    const { data, error } = await getSupabase().rpc('admin_dashboard_stats')
    if (error) throw toServiceError(error)
    throwIfRpcFailed(data)
    return statsFromRpc(data)
  },

  async listTeams(query = {}) {
    const teams = await fetchTeams()
    return teams.filter((t) => matchesTeam(t, query.search ?? '', query.status))
  },

  getTeam: fetchTeam,

  async updateTeamStatus(teamId, status, note) {
    const { data, error } = await getSupabase().rpc('admin_set_team_status', {
      p_team_id: teamId,
      p_status: status,
      p_note: note ?? undefined,
    })
    if (error) throw toServiceError(error)
    throwIfRpcFailed(data)
    const team = await fetchTeam(teamId)
    if (!team) throw new ServiceError('NOT_FOUND')
    return team
  },

  async getSettings() {
    const supabase = getSupabase()
    const [settings, availability] = await Promise.all([
      supabase.from('competition_settings').select('registration_open, maximum_teams').eq('id', 1).single(),
      supabase.rpc('get_registration_availability'),
    ])
    if (settings.error) throw toServiceError(settings.error)
    if (availability.error) throw toServiceError(availability.error)
    const o = (availability.data ?? {}) as Record<string, unknown>
    const derived = deriveAvailability(
      { registrationOpen: settings.data.registration_open, maximumTeams: settings.data.maximum_teams },
      Number(o.registered_teams ?? 0),
    )
    return {
      registrationOpen: settings.data.registration_open,
      maximumTeams: settings.data.maximum_teams,
      registeredTeams: derived.registeredTeams,
    }
  },

  async setRegistrationOpen(open) {
    const { data, error } = await getSupabase()
      .from('competition_settings')
      .update({ registration_open: open })
      .eq('id', 1)
      .select('registration_open')
    if (error) throw toServiceError(error)
    // RLS turns an unauthorised update into "0 rows", not an error.
    if (data.length !== 1) throw new ServiceError('FORBIDDEN')
  },

  async listOrphanUploads() {
    const { data, error } = await getSupabase().rpc('admin_list_orphan_uploads')
    if (error) throw toServiceError(error)
    throwIfRpcFailed(data)
    const paths = (data as { paths?: unknown }).paths
    return Array.isArray(paths) ? paths.map(String) : []
  },

  async removeUploads(paths) {
    if (paths.length === 0) return
    const { error } = await getSupabase().storage.from(AADHAAR_BUCKET).remove(paths)
    if (error) throw toServiceError(error)
  },
}
