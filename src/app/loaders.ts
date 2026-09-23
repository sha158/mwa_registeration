import { redirect, type LoaderFunctionArgs } from 'react-router'
import { firstIncompleteMember, isMemberNumber, useRegistrationStore } from '@/features/registration/store'
import { adminService, authService, registrationService } from '@/services'
import type { MemberNumber } from '@/types/domain'

export const availabilityLoader = () => registrationService.getAvailability()

/** /register → first step that still needs completing. */
export function registerIndexLoader() {
  const next = firstIncompleteMember(useRegistrationStore.getState().members)
  return redirect(next ? `/register/member/${next}` : '/register/review')
}

/** A member step is reachable only once the previous members are complete. */
export function memberStepLoader({ params }: LoaderFunctionArgs): { memberNumber: MemberNumber } {
  const n = Number(params.memberNumber)
  if (!isMemberNumber(n)) throw redirect('/register')
  const next = firstIncompleteMember(useRegistrationStore.getState().members)
  if (next !== null && next < n) throw redirect(`/register/member/${next}`)
  return { memberNumber: n }
}

export function reviewLoader() {
  const next = firstIncompleteMember(useRegistrationStore.getState().members)
  if (next !== null) throw redirect(`/register/member/${next}`)
  return null
}

export function successLoader() {
  const { success } = useRegistrationStore.getState()
  if (!success) throw redirect('/')
  return success
}

// ---------- Admin ----------

export async function requireAdminLoader({ request }: LoaderFunctionArgs) {
  const session = await authService.getSession()
  if (!session) {
    const { pathname } = new URL(request.url)
    throw redirect(`/admin/login?next=${encodeURIComponent(pathname)}`)
  }
  return session
}

export async function adminLoginLoader() {
  const session = await authService.getSession()
  return session ? redirect('/admin') : null
}

export async function dashboardLoader() {
  const [stats, teams, settings] = await Promise.all([
    adminService.getStats(),
    adminService.listTeams({ status: 'submitted' }),
    adminService.getSettings(),
  ])
  return { stats, pendingTeams: teams, registrationOpen: settings.registrationOpen }
}

export const teamsLoader = () => adminService.listTeams()

export async function teamDetailLoader({ params }: LoaderFunctionArgs) {
  const team = await adminService.getTeam(params.teamId ?? '')
  if (!team) throw new Response('Team not found', { status: 404 })
  return team
}

export const settingsLoader = () => adminService.getSettings()
