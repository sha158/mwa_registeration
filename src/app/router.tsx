import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { PublicLayout } from '@/layouts/PublicLayout'
import { RegistrationLayout } from '@/layouts/RegistrationLayout'
import { RootLayout } from '@/layouts/RootLayout'
import { PageLoader } from '@/components/ui/PageLoader'
import LandingPage from '@/pages/public/LandingPage'
import NotFoundPage from '@/pages/NotFoundPage'
import RouteErrorPage from '@/pages/RouteErrorPage'
import {
  adminLoginLoader,
  availabilityLoader,
  dashboardLoader,
  memberStepLoader,
  registerIndexLoader,
  requireAdminLoader,
  requireAdminMiddleware,
  reviewLoader,
  settingsLoader,
  successLoader,
  teamDetailLoader,
  teamsLoader,
} from './loaders'

const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default })

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    ErrorBoundary: RouteErrorPage,
    HydrateFallback: PageLoader,
    children: [
      {
        Component: PublicLayout,
        children: [
          { index: true, loader: availabilityLoader, Component: LandingPage },
          { path: 'rules', lazy: page(() => import('@/pages/public/RulesPage')) },
          { path: 'register/success', loader: successLoader, lazy: page(() => import('@/pages/public/SuccessPage')) },
          { path: '*', Component: NotFoundPage },
        ],
      },
      {
        path: 'register',
        Component: RegistrationLayout,
        loader: availabilityLoader,
        // Availability is re-checked authoritatively on submit; avoid refetching between steps.
        shouldRevalidate: ({ currentUrl, nextUrl }) => !currentUrl.pathname.startsWith('/register') || !nextUrl.pathname.startsWith('/register'),
        children: [
          { index: true, loader: registerIndexLoader },
          { path: 'member/:memberNumber', loader: memberStepLoader, lazy: page(() => import('@/pages/public/MemberStepPage')) },
          { path: 'review', loader: reviewLoader, lazy: page(() => import('@/pages/public/ReviewPage')) },
        ],
      },
      { path: 'admin/login', loader: adminLoginLoader, lazy: page(() => import('@/pages/admin/LoginPage')) },
      {
        path: 'admin',
        middleware: [requireAdminMiddleware],
        loader: requireAdminLoader,
        lazy: async () => ({ Component: (await import('@/layouts/AdminLayout')).AdminLayout }),
        children: [
          { index: true, loader: dashboardLoader, lazy: page(() => import('@/pages/admin/DashboardPage')) },
          {
            path: 'teams',
            loader: teamsLoader,
            // Status filtering is client-side; changing ?status should not refetch.
            shouldRevalidate: ({ currentUrl, nextUrl, defaultShouldRevalidate }) =>
              currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search ? false : defaultShouldRevalidate,
            lazy: page(() => import('@/pages/admin/TeamsPage')),
          },
          { path: 'teams/:teamId', loader: teamDetailLoader, lazy: page(() => import('@/pages/admin/TeamDetailPage')) },
          { path: 'settings', loader: settingsLoader, lazy: page(() => import('@/pages/admin/SettingsPage')) },
        ],
      },
    ],
  },
])
