import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { participantsCsv, teamsCsv } from '@/services/csvExport'
import { teamFromRow } from '@/services/supabase/mappers'
import { adminClient, anonClient, cleanUp, getSettings, occupiedSlots, prepareTeam, register, type Client } from './helpers'

describe('admin', () => {
  let admin: Client
  let teamId = ''
  let registrationNumber = ''

  beforeAll(async () => {
    admin = await adminClient()
    const result = await register(anonClient(), await prepareTeam(anonClient()))
    registrationNumber = String(result.registration_number)
    const { data } = await admin.from('teams').select('id').eq('registration_number', registrationNumber).single()
    teamId = data?.id ?? ''
  })
  afterAll(async () => cleanUp(admin))

  it('is recognised as an organiser', async () => {
    const { data: user } = await admin.auth.getUser()
    const { data } = await admin.from('admin_profiles').select('user_id').eq('user_id', user.user?.id ?? '').maybeSingle()
    expect(data).not.toBeNull()
  })

  it('reads dashboard stats consistent with public availability', async () => {
    const { data } = await admin.rpc('admin_dashboard_stats')
    const stats = data as Record<string, number>
    expect(stats.registered_teams).toBe(await occupiedSlots(anonClient()))
    expect(stats.participants).toBe(stats.registered_teams * 3)
  })

  it('lists teams with members and maps them to domain types', async () => {
    const { data, error } = await admin.from('teams').select('*, team_members(*)').eq('id', teamId).single()
    if (error || !data) throw error ?? new Error('team not found')
    const team = teamFromRow(data)
    expect(team.registrationNumber).toBe(registrationNumber)
    expect(team.members).toHaveLength(3)
  })

  it('verifies, rejects with a note and reinstates a team', async () => {
    expect((await admin.rpc('admin_set_team_status', { p_team_id: teamId, p_status: 'verified' })).data).toMatchObject({ ok: true })
    expect((await admin.from('teams').select('status').eq('id', teamId).single()).data?.status).toBe('verified')

    await admin.rpc('admin_set_team_status', { p_team_id: teamId, p_status: 'rejected', p_note: 'Aadhaar unreadable' })
    const rejected = (await admin.from('teams').select('status, admin_note').eq('id', teamId).single()).data
    expect(rejected).toEqual({ status: 'rejected', admin_note: 'Aadhaar unreadable' })

    await admin.rpc('admin_set_team_status', { p_team_id: teamId, p_status: 'submitted' })
    expect((await admin.from('teams').select('status, admin_note').eq('id', teamId).single()).data).toEqual({
      status: 'submitted',
      admin_note: null,
    })
  })

  it('cannot reinstate a rejected team when every slot is taken', async () => {
    const original = await getSettings(admin)
    try {
      // Another team must hold a slot so capacity can be set to "exactly full" (minimum is 1).
      expect((await register(anonClient(), await prepareTeam(anonClient()))).ok).toBe(true)
      await admin.rpc('admin_set_team_status', { p_team_id: teamId, p_status: 'rejected' })
      const full = await admin.from('competition_settings').update({ maximum_teams: await occupiedSlots(anonClient()) }).eq('id', 1).select()
      expect(full.error).toBeNull()
      expect(full.data).toHaveLength(1)
      const { data } = await admin.rpc('admin_set_team_status', { p_team_id: teamId, p_status: 'submitted' })
      expect(data).toMatchObject({ ok: false, error: 'REGISTRATION_FULL' })
    } finally {
      await admin.from('competition_settings').update({ maximum_teams: original.maximum_teams }).eq('id', 1)
      await admin.rpc('admin_set_team_status', { p_team_id: teamId, p_status: 'submitted' })
    }
  })

  it('opens and closes registration persistently', async () => {
    const original = await getSettings(admin)
    try {
      const closed = await admin.from('competition_settings').update({ registration_open: false }).eq('id', 1).select()
      expect(closed.data).toHaveLength(1)
      const { data } = await anonClient().rpc('get_registration_availability')
      expect((data as { registration_open: boolean }).registration_open).toBe(false)
    } finally {
      await admin.from('competition_settings').update({ registration_open: original.registration_open }).eq('id', 1)
    }
  })

  it('cannot change fields outside the admin grant', async () => {
    const { error } = await admin.from('competition_settings').update({ next_registration_seq: 1 }).eq('id', 1)
    expect(error).not.toBeNull()
  })

  it('exports CSVs from real data without document references', async () => {
    const { data } = await admin.from('teams').select('*, team_members(*)')
    const teams = (data ?? []).map(teamFromRow)
    const [teamsText, participantsText] = await Promise.all([teamsCsv(teams).text(), participantsCsv(teams).text()])
    expect(teamsText).toContain(registrationNumber)
    expect(participantsText).toContain(registrationNumber)
    expect(participantsText).not.toContain('submissions/')
    expect(participantsText).not.toContain('aadhaar')
  })

  it('lists abandoned uploads (older than the threshold) without referenced front or back files', async () => {
    const { data } = await admin.rpc('admin_list_orphan_uploads', { p_older_than: '0 seconds' })
    const paths = (data as { paths: string[] }).paths
    const { data: members } = await admin
      .from('team_members')
      .select('aadhaar_storage_path, aadhaar_back_storage_path')
      .eq('team_id', teamId)
    const referenced = (members ?? []).flatMap((m) => [m.aadhaar_storage_path, m.aadhaar_back_storage_path]).filter(Boolean)
    expect(referenced).toHaveLength(5) // 2 members × front + back, 1 member × PDF
    for (const path of referenced) expect(paths).not.toContain(path)
  })

  it('returns every front and back path when a team is deleted', async () => {
    const result = await register(anonClient(), await prepareTeam(anonClient()))
    const { data: team } = await admin.from('teams').select('id').eq('registration_number', String(result.registration_number)).single()
    const { data } = await admin.rpc('admin_delete_team', { p_team_id: team?.id ?? '' })
    const deleted = data as { ok: boolean; storage_paths: string[] }
    expect(deleted.ok).toBe(true)
    expect(deleted.storage_paths).toHaveLength(5)
    expect(deleted.storage_paths.every((p) => typeof p === 'string' && p.startsWith('submissions/'))).toBe(true)
  })
})
