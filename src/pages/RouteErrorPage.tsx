import { ShieldAlert, TriangleAlert, WifiOff } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Button, ButtonLink } from '@/components/ui/Button'
import { StateMessage } from '@/components/ui/States'
import { ServiceError } from '@/services'
import NotFoundPage from './NotFoundPage'

/** Route-level error boundary: not found, unauthorized, offline and unexpected errors. */
export default function RouteErrorPage() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  const reload = (
    <Button variant="secondary" onClick={() => window.location.reload()}>
      Try again
    </Button>
  )

  let content
  if (error instanceof ServiceError && error.code === 'UNAUTHORIZED') {
    content = (
      <StateMessage
        tone="danger"
        icon={<ShieldAlert />}
        title="Access denied"
        description="Your account does not have organiser access."
        action={<ButtonLink to="/admin/login">Sign in with another account</ButtonLink>}
      />
    )
  } else if (!navigator.onLine || (error instanceof ServiceError && error.code === 'NETWORK_ERROR')) {
    content = (
      <StateMessage
        tone="warning"
        icon={<WifiOff />}
        title="No internet connection"
        description="Check your connection and try again."
        action={reload}
      />
    )
  } else {
    content = (
      <StateMessage
        tone="danger"
        icon={<TriangleAlert />}
        title="Something went wrong"
        description="Please try again. If the problem continues, contact the organisers."
        action={
          <>
            {reload}
            <ButtonLink to="/">Go home</ButtonLink>
          </>
        }
      />
    )
  }

  return (
    <main id="main" className="mx-auto max-w-form px-4 py-16">
      <h1 className="sr-only">Error</h1>
      {content}
    </main>
  )
}
