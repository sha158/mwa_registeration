import { LayoutDashboard, LogOut, Settings, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, Outlet, useLoaderData, useNavigate } from 'react-router'
import type { requireAdminLoader } from '@/app/loaders'
import { authService } from '@/services'
import { cn } from '@/utils/cn'
import { SiteHeader } from './SiteHeader'

const NAV: { to: string; label: string; icon: ReactNode; end?: boolean }[] = [
  { to: '/admin', label: 'Overview', icon: <LayoutDashboard />, end: true },
  { to: '/admin/teams', label: 'Teams', icon: <UsersRound /> },
  { to: '/admin/settings', label: 'Settings', icon: <Settings /> },
]

export function AdminLayout() {
  const session = useLoaderData<typeof requireAdminLoader>()
  const navigate = useNavigate()

  async function signOut() {
    await authService.signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        width="admin"
        title="Admin Portal"
        trailing={
          <>
            <span className="hidden text-small text-ink-muted md:inline">{session.email}</span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-3 text-label font-semibold text-ink-muted hover:bg-surface-low hover:text-brand"
            >
              <LogOut aria-hidden className="size-4" />
              Sign out
            </button>
          </>
        }
      />
      <nav aria-label="Admin" className="border-b border-line bg-surface">
        <ul className="mx-auto flex max-w-admin gap-1 px-2 sm:px-4">
          {NAV.map((item) => (
            <li key={item.to} className="flex-1 sm:flex-none">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-12 items-center justify-center gap-2 border-b-2 px-3 text-label font-semibold transition-colors [&>svg]:size-[18px]',
                    isActive ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink',
                  )
                }
              >
                <span aria-hidden className="contents">
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main id="main" className="mx-auto w-full max-w-admin flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
