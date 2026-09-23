import { createContext, redirect, type LoaderFunctionArgs, type MiddlewareFunction } from 'react-router'
import { firstIncompleteMember, isMemberNumber, useRegistrationStore } from '@/features/registration/store'
import { adminService, authService, registrationService, ServiceError } from '@/services'
import type { AdminSession, MemberNumber } from '@/types/domain'

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

const adminSessionContext = createContext<AdminSession | null>(null)

/**
 * Runs before any admin loader (loaders of matched routes run in parallel, so a check in the
 * parent loader would still let child data requests fire for signed-out visitors).
 */
export const requireAdminMiddleware: MiddlewareFunction = async ({ request, context }, next) => {
  const session = await authService.getSession()
  if (!session) {
    const { pathname } = new URL(request.url)
    throw redirect(`/admin/login?next=${encodeURIComponent(pathname)}`)
  }
  context.set(adminSessionContext, session)
  return next()
}

export function requireAdminLoader({ context }: LoaderFunctionArgs): AdminSession {
  const session = context.get(adminSessionContext)
  if (!session) throw new ServiceError('UNAUTHORIZED')
  return session
}

export async function adminLoginLoader() {
  try {
    const session = await authService.getSession()
    return session ? redirect('/admin') : null
  } catch (error) {
    // Signed in with an account that is not an organiser: sign out and show the form.
    if (error instanceof ServiceError && error.code === 'FORBIDDEN') {
      await authService.signOut()
      return null
    }
    throw error
  }
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

export async function settingsLoader() {
  const [settings, orphanUploads] = await Promise.all([adminService.getSettings(), adminService.listOrphanUploads()])
  return { settings, orphanUploads }
}
