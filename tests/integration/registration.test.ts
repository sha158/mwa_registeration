import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  adminClient,
  anonClient,
  cleanUp,
  getSettings,
  occupiedSlots,
  prepareTeam,
  randomMobile,
  register,
  uploadAadhaar,
  type Client,
} from './helpers'
import type { Json } from '@/services/supabase/database.types'

describe('register_team', () => {
  const anon = anonClient()
  let admin: Client

  beforeAll(async () => {
    admin = await adminClient()
  })
  afterAll(async () => cleanUp(admin))

  it('registers a complete team atomically with a server-assigned number', async () => {
    const team = await prepareTeam(anon, [{}, { participant_status: 'working', course_details: null, institution: null, occupation: 'Clerk', employer: 'Bank' }, {}])
    const result = await register(anon, team)
    expect(result).toMatchObject({ ok: true })
    expect(result.registration_number).toMatch(/^MWA-\d{3}$/)
    expect(result.member_names).toHaveLength(3)

    const { data } = await admin
      .from('teams')
      .select('status, team_members(member_number, mobile_number, aadhaar_mime_type, aadhaar_back_mime_type)')
      .eq('registration_number', String(result.registration_number))
      .single()
    expect(data?.status).toBe('submitted')
    const byNumber = [...(data?.team_members ?? [])].sort((a, b) => a.member_number - b.member_number)
    expect(byNumber.map((m) => m.member_number)).toEqual([1, 2, 3])
    // Members 1–2: card photos (front + back). Member 3: e-Aadhaar PDF only.
    expect(byNumber.map((m) => [m.aadhaar_mime_type, m.aadhaar_back_mime_type])).toEqual([
      ['image/jpeg', 'image/jpeg'],
      ['image/jpeg', 'image/jpeg'],
      ['application/pdf', null],
    ])
  })

  it('is idempotent for a retried submission', async () => {
    const team = await prepareTeam(anon)
    const first = await register(anon, team)
    const retry = await register(anonClient(), team)
    expect(retry.registration_number).toBe(first.registration_number)
  })

  it('stores normalised mobile numbers', async () => {
    const mobile = randomMobile()
    const team = await prepareTeam(anon, [{ mobile_number: `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}` }])
    const result = await register(anon, team)
    const { data } = await admin
      .from('team_members')
      .select('mobile_number, teams!inner(registration_number)')
      .eq('teams.registration_number', String(result.registration_number))
      .eq('member_number', 1)
      .single()
    expect(data?.mobile_number).toBe(mobile)
  })

  it.each([
    ['underage', { date_of_birth: '2012-01-01' }, 'INVALID_ELIGIBILITY', 'date_of_birth'],
    ['over age', { date_of_birth: '1990-01-01' }, 'INVALID_ELIGIBILITY', 'date_of_birth'],
    ['Madrasa student', { studying_in_madrasa: true }, 'INVALID_ELIGIBILITY', 'studying_in_madrasa'],
    ['Aalim', { is_aalim: true }, 'INVALID_ELIGIBILITY', 'is_aalim'],
    ['district outside DK / Udupi', { district: 'Bengaluru Urban' }, 'INVALID_ELIGIBILITY', 'district'],
    ['invalid mobile', { mobile_number: '12345' }, 'INVALID_INPUT', 'mobile_number'],
    ['missing student details', { institution: '' }, 'INVALID_INPUT', 'participant_status'],
  ])('rejects %s', async (_label, override, error, field) => {
    const team = await prepareTeam(anon, [{}, override])
    expect(await register(anon, team)).toMatchObject({ ok: false, error, member_number: 2, field })
  })

  it('rejects a team without exactly 3 members', async () => {
    const team = await prepareTeam(anon)
    expect(await register(anon, { ...team, members: team.members.slice(0, 2) })).toMatchObject({ ok: false, error: 'INVALID_TEAM_SIZE' })
    const dup = [team.members[0], team.members[0], team.members[2]].filter((m) => m !== undefined)
    expect(await register(anon, { ...team, members: dup })).toMatchObject({ ok: false, error: 'INVALID_TEAM_SIZE' })
  })

  it('requires all three consents', async () => {
    const team = await prepareTeam(anon)
    expect(await register(anon, team, { eligibility: true, accuracy: true, data_use: false })).toMatchObject({
      ok: false,
      error: 'INVALID_INPUT',
      field: 'consent',
    })
  })

  it('rejects a document that belongs to another submission or does not exist', async () => {
    const team = await prepareTeam(anon)
    const foreign = await uploadAadhaar(anon, crypto.randomUUID(), 1)
    const members = [{ ...team.members[0], aadhaar_storage_path: foreign }, team.members[1], team.members[2]]
    expect(await register(anon, { ...team, members })).toMatchObject({ ok: false, error: 'INVALID_DOCUMENT', member_number: 1 })

    const missing = `submissions/${team.submissionId}/member-1/${crypto.randomUUID()}.pdf`
    const members2 = [{ ...team.members[0], aadhaar_storage_path: missing }, team.members[1], team.members[2]]
    expect(await register(anon, { ...team, members: members2 })).toMatchObject({ ok: false, error: 'INVALID_DOCUMENT' })
  })

  it('requires the back of the card unless the front is the e-Aadhaar PDF', async () => {
    const team = await prepareTeam(anon)
    const noBack = { ...team.members[0], aadhaar_back_storage_path: null, aadhaar_back_file_name: null }
    expect(await register(anon, { ...team, members: [noBack, team.members[1], team.members[2]] })).toMatchObject({
      ok: false,
      error: 'INVALID_DOCUMENT',
      member_number: 1,
      side: 'back',
    })
  })

  it('rejects a back side that reuses the front file or belongs to another submission', async () => {
    const team = await prepareTeam(anon)
    const m2 = team.members[1] as Record<string, Json>
    const sameFile = { ...m2, aadhaar_back_storage_path: m2.aadhaar_storage_path }
    expect(await register(anon, { ...team, members: [team.members[0], sameFile, team.members[2]] })).toMatchObject({
      ok: false,
      error: 'INVALID_DOCUMENT',
      member_number: 2,
      side: 'back',
    })

    const foreign = await uploadAadhaar(anon, crypto.randomUUID(), 2, 'jpeg')
    const foreignBack = { ...m2, aadhaar_back_storage_path: foreign }
    expect(await register(anon, { ...team, members: [team.members[0], foreignBack, team.members[2]] })).toMatchObject({
      ok: false,
      error: 'INVALID_DOCUMENT',
      member_number: 2,
      side: 'back',
    })
  })

  it('rejects the same mobile twice within a team', async () => {
    const mobile = randomMobile()
    const team = await prepareTeam(anon, [{ mobile_number: mobile }, { mobile_number: `+91 ${mobile}` }])
    expect(await register(anon, team)).toMatchObject({ ok: false, error: 'DUPLICATE_PARTICIPANT', member_numbers: [2] })
  })

  it('rejects a mobile already registered in another team', async () => {
    const first = await prepareTeam(anon)
    expect((await register(anon, first)).ok).toBe(true)
    const taken = String(first.members[1]?.mobile_number)
    const second = await prepareTeam(anon, [{}, {}, { mobile_number: taken }])
    expect(await register(anon, second)).toMatchObject({ ok: false, error: 'DUPLICATE_PARTICIPANT', member_numbers: [3] })
  })

  it('writes nothing when a registration fails', async () => {
    const before = await occupiedSlots(anon)
    const team = await prepareTeam(anon, [{}, {}, { is_aalim: true }])
    await register(anon, team)
    expect(await occupiedSlots(anon)).toBe(before)
    const { count } = await admin.from('teams').select('id', { count: 'exact', head: true }).eq('submission_id', team.submissionId)
    expect(count).toBe(0)
  })
})

describe('registration open / capacity (temporarily changes settings, then restores them)', () => {
  let admin: Client
  let original: { registration_open: boolean; maximum_teams: number }

  beforeAll(async () => {
    admin = await adminClient()
    const s = await getSettings(admin)
    original = { registration_open: s.registration_open, maximum_teams: s.maximum_teams }
  })

  afterAll(async () => {
    await admin.from('competition_settings').update(original).eq('id', 1)
    await cleanUp(admin)
  })

  it('rejects registrations while registration is closed, even via direct RPC', async () => {
    const team = await prepareTeam(anonClient())
    await admin.from('competition_settings').update({ registration_open: false }).eq('id', 1)
    expect(await register(anonClient(), team)).toMatchObject({ ok: false, error: 'REGISTRATION_CLOSED' })
    await admin.from('competition_settings').update({ registration_open: true }).eq('id', 1)
    expect((await register(anonClient(), team)).ok).toBe(true)
  })

  it('race: two simultaneous submissions for the final slot → exactly one succeeds', async () => {
    const anon = anonClient()
    const occupied = await occupiedSlots(anon)
    const { error } = await admin.from('competition_settings').update({ maximum_teams: occupied + 1 }).eq('id', 1)
    expect(error).toBeNull()

    const [a, b] = await Promise.all([prepareTeam(anonClient()), prepareTeam(anonClient())])
    const results = await Promise.all([register(anonClient(), a), register(anonClient(), b)])

    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(results.filter((r) => !r.ok)).toEqual([expect.objectContaining({ error: 'REGISTRATION_FULL' })])
    expect(await occupiedSlots(anon)).toBe(occupied + 1)

    const late = await prepareTeam(anonClient())
    expect(await register(anonClient(), late)).toMatchObject({ ok: false, error: 'REGISTRATION_FULL' })
    expect(await occupiedSlots(anon)).toBe(occupied + 1)
  })

  it('race at scale: 5 concurrent submissions for 2 remaining slots → exactly 2 succeed', async () => {
    const anon = anonClient()
    const occupied = await occupiedSlots(anon)
    await admin.from('competition_settings').update({ maximum_teams: occupied + 2 }).eq('id', 1)
    const teams = await Promise.all(Array.from({ length: 5 }, () => prepareTeam(anonClient())))
    const results = await Promise.all(teams.map((t) => register(anonClient(), t)))
    expect(results.filter((r) => r.ok)).toHaveLength(2)
    expect(results.filter((r) => r.error === 'REGISTRATION_FULL')).toHaveLength(3)
    expect(await occupiedSlots(anon)).toBe(occupied + 2)
  })
})
