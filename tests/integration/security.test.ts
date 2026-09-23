import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminClient, anonClient, BUCKET, cleanUp, prepareTeam, register, type Client } from './helpers'

/** Row Level Security and storage policies, exercised as an anonymous participant. */
describe('anonymous access is blocked', () => {
  const anon = anonClient()
  let admin: Client
  let aadhaarPath = ''
  let teamId = ''

  beforeAll(async () => {
    admin = await adminClient()
    const team = await prepareTeam(anonClient())
    const result = await register(anonClient(), team)
    expect(result.ok).toBe(true)
    aadhaarPath = String(team.members[0]?.aadhaar_storage_path)
    const { data } = await admin.from('teams').select('id').eq('registration_number', String(result.registration_number)).single()
    teamId = data?.id ?? ''
  })

  afterAll(async () => cleanUp(admin))

  it.each(['teams', 'team_members', 'competition_settings', 'admin_profiles'] as const)('cannot read %s', async (table) => {
    const { data, error } = await anon.from(table).select('*')
    // Either denied outright (no grant) or filtered to nothing by RLS — never rows.
    expect(error !== null || (data ?? []).length === 0).toBe(true)
  })

  it('cannot change registration settings', async () => {
    const { data, error } = await anon.from('competition_settings').update({ registration_open: false }).eq('id', 1).select()
    expect(error !== null || (data ?? []).length === 0).toBe(true)
    expect((await admin.from('competition_settings').select('registration_open').eq('id', 1).single()).data?.registration_open).toBe(true)
  })

  it('cannot verify, reject or delete teams', async () => {
    const setStatus = await anon.rpc('admin_set_team_status', { p_team_id: teamId, p_status: 'verified' })
    expect(setStatus.error).not.toBeNull()
    const del = await anon.rpc('admin_delete_team', { p_team_id: teamId })
    expect(del.error).not.toBeNull()
    const stats = await anon.rpc('admin_dashboard_stats')
    expect(stats.error).not.toBeNull()
    const { data } = await admin.from('teams').select('status').eq('id', teamId).single()
    expect(data?.status).toBe('submitted')
  })

  it('cannot list, download or sign Aadhaar documents', async () => {
    const list = await anon.storage.from(BUCKET).list('submissions')
    expect(list.error !== null || (list.data ?? []).length === 0).toBe(true)
    const download = await anon.storage.from(BUCKET).download(aadhaarPath)
    expect(download.error).not.toBeNull()
    const signed = await anon.storage.from(BUCKET).createSignedUrl(aadhaarPath, 60)
    expect(signed.error).not.toBeNull()
    const publicUrl = anon.storage.from(BUCKET).getPublicUrl(aadhaarPath).data.publicUrl
    expect((await fetch(publicUrl)).ok).toBe(false)
  })

  it('cannot upload outside the submission path layout or overwrite a file', async () => {
    // Blobs must carry a type: an untyped Blob uploads as octet-stream and is rejected by the
    // bucket MIME list before the path policy is even evaluated.
    const pdf = (bytes: BlobPart) => new Blob([bytes], { type: 'application/pdf' })
    const bad = await anon.storage.from(BUCKET).upload(`anything/${crypto.randomUUID()}.pdf`, pdf('%PDF-1.4'), {
      contentType: 'application/pdf',
    })
    expect(bad.error).not.toBeNull()
    const overwrite = await anon.storage.from(BUCKET).upload(aadhaarPath, pdf('%PDF-1.4'), {
      contentType: 'application/pdf',
      upsert: true,
    })
    expect(overwrite.error).not.toBeNull()
  })

  it('cannot upload disallowed types or oversized files', async () => {
    const base = `submissions/${crypto.randomUUID()}/member-1/${crypto.randomUUID()}`
    const html = await anon.storage.from(BUCKET).upload(`${base}.pdf`, new Blob(['<html>'], { type: 'text/html' }), {
      contentType: 'text/html',
    })
    expect(html.error).not.toBeNull()
    const big = await anon.storage.from(BUCKET).upload(`${base}.pdf`, new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], { type: 'application/pdf' }), {
      contentType: 'application/pdf',
    })
    expect(big.error).not.toBeNull()
  })

  it('admin can open a document through a short-lived signed URL', async () => {
    const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(aadhaarPath, 60)
    expect(error).toBeNull()
    const response = await fetch(data?.signedUrl ?? '')
    expect(response.status).toBe(200)
  })
})
