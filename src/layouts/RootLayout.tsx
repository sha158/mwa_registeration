import { WifiOff } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Outlet, ScrollRestoration, useLocation, useNavigation } from 'react-router'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function RootLayout() {
  const navigation = useNavigation()
  const online = useOnlineStatus()
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)

  // Move focus to the new page heading after client-side navigation (screen reader context).
  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    const heading = document.querySelector<HTMLElement>('main h1')
    if (heading) {
      heading.tabIndex = -1
      heading.focus({ preventScroll: true })
    }
  }, [pathname])

  return (
    <>
      <a
        href="#main"
        className="sr-only z-100 rounded-control bg-brand px-4 py-3 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      {navigation.state !== 'idle' && (
        <div role="progressbar" aria-label="Loading page" className="fixed inset-x-0 top-0 z-60 h-0.5 overflow-hidden bg-brand-soft">
          <div className="h-full w-1/3 motion-safe:animate-[loading_1s_ease-in-out_infinite] bg-brand" />
        </div>
      )}
      {!online && (
        <div role="status" className="sticky top-0 z-60 flex items-center justify-center gap-2 bg-ink px-4 py-2 text-small text-white">
          <WifiOff aria-hidden className="size-4" />
          You're offline. Details you've entered are kept on this device.
        </div>
      )}
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
