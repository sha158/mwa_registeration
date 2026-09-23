import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/services/supabase/database.types'

export const BUCKET = 'aadhaar-documents'
export type Client = SupabaseClient<Database>

const url = () => process.env.VITE_SUPABASE_URL as string
const key = () => process.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

/** A fresh anonymous client, like a participant's browser. */
export const anonClient = (): Client => createClient<Database>(url(), key(), { auth: { persistSession: false } })

export async function adminClient(): Promise<Client> {
  const client = anonClient()
  const { error } = await client.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL as string,
    password: process.env.TEST_ADMIN_PASSWORD as string,
  })
  if (error) throw new Error(`Test admin sign-in failed: ${error.message}`)
  return client
}

/** Random, valid, very unlikely-to-collide Indian mobile numbers for test participants. */
export const randomMobile = () => `9${Math.floor(100_000_000 + Math.random() * 899_999_999)}`

const PDF = new TextEncoder().encode('%PDF-1.4\n% integration test document (not a real ID)\n')

/** Everything a test run creates, so it can be removed afterwards. */
export const created = { teamRegistrationNumbers: new Set<string>(), uploadPaths: new Set<string>() }

export async function uploadAadhaar(client: Client, submissionId: string, memberNumber: number): Promise<string> {
  const path = `submissions/${submissionId}/member-${memberNumber}/${crypto.randomUUID()}.pdf`
  const { error } = await client.storage.from(BUCKET).upload(path, new Blob([PDF], { type: 'application/pdf' }), {
    contentType: 'application/pdf',
    upsert: false,
  })
  if (error) throw new Error(`upload failed: ${error.message}`)
  created.uploadPaths.add(path)
  return path
}

type MemberOverrides = Partial<Record<string, Json>>

export function member(n: number, aadhaarPath: string, overrides: MemberOverrides = {}): { [key: string]: Json } {
  return {
    member_number: n,
    full_name: `Test Participant ${'ABC'[n - 1]}`,
    mobile_number: randomMobile(),
    date_of_birth: '2002-06-15',
    residential_address: 'Integration test address, Udupi 574106',
    district: 'Udupi',
    participant_status: 'student',
    course_details: 'B.Com',
    institution: 'Test College',
    occupation: null,
    employer: null,
    studying_in_madrasa: false,
    is_aalim: false,
    aadhaar_storage_path: aadhaarPath,
    aadhaar_file_name: `aadhaar_member_${n}.pdf`,
    ...overrides,
  }
}

export const CONSENT = { eligibility: true, accuracy: true, data_use: true }

/** Uploads three documents and returns a valid team payload for a new submission. */
export async function prepareTeam(client: Client, overrides: MemberOverrides[] = []) {
  const submissionId = crypto.randomUUID()
  const members = []
  for (const n of [1, 2, 3]) {
    members.push(member(n, await uploadAadhaar(client, submissionId, n), overrides[n - 1]))
  }
  return { submissionId, members }
}

export async function register(client: Client, team: { submissionId: string; members: Json[] }, consent: Json = CONSENT) {
  const { data, error } = await client.rpc('register_team', {
    p_submission_id: team.submissionId,
    p_members: team.members,
    p_consent: consent,
  })
  if (error) throw new Error(`register_team error: ${error.message}`)
  const result = data as { ok: boolean; error?: string; registration_number?: string; [k: string]: unknown }
  if (result.ok && result.registration_number) created.teamRegistrationNumbers.add(result.registration_number)
  return result
}

/** Deletes every team and upload this run created (admin-only functions / storage policy). */
export async function cleanUp(admin: Client) {
  for (const number of created.teamRegistrationNumbers) {
    const { data } = await admin.from('teams').select('id').eq('registration_number', number).maybeSingle()
    if (data) await admin.rpc('admin_delete_team', { p_team_id: data.id })
  }
  const paths = [...created.uploadPaths]
  for (let i = 0; i < paths.length; i += 100) {
    await admin.storage.from(BUCKET).remove(paths.slice(i, i + 100))
  }
  created.teamRegistrationNumbers.clear()
  created.uploadPaths.clear()
}

export async function getSettings(admin: Client) {
  const { data, error } = await admin.from('competition_settings').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}

export async function occupiedSlots(client: Client): Promise<number> {
  const { data } = await client.rpc('get_registration_availability')
  return Number((data as { registered_teams: number }).registered_teams)
}
