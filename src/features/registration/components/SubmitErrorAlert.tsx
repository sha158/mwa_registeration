import { Link } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { EVENT } from '@/config/event'
import type { SubmitError } from '@/types/domain'

const linkClass = 'font-semibold text-brand underline underline-offset-2'

/** User-facing explanation and next step for every non-success submission outcome. */
export function SubmitErrorAlert({ error, onRetry }: { error: SubmitError; onRetry: () => void }) {
  switch (error.error) {
    case 'REGISTRATION_FULL':
      return (
        <Alert tone="danger" live title="Registration is now full">
          All team slots were filled while you were completing the form. We're sorry — your team could not be
          registered. <Link to="/" className={linkClass}>Back to overview</Link>
        </Alert>
      )
    case 'REGISTRATION_CLOSED':
      return (
        <Alert tone="danger" live title="Registration closed">
          Registration has been closed by the organisers. <Link to="/" className={linkClass}>Back to overview</Link>
        </Alert>
      )
    case 'DUPLICATE_PARTICIPANT':
      return (
        <Alert tone="warning" live title="Participant already registered">
          {error.memberNumbers.length === 1 ? 'Member ' : 'Members '}
          {error.memberNumbers.join(' and ')}{' '}
          {error.memberNumbers.length === 1 ? 'is' : 'are'} already registered in another team (same mobile number).{' '}
          {error.memberNumbers.map((n) => (
            <Link key={n} to={`/register/member/${n}`} className={`${linkClass} mr-3`}>
              Edit member {n}
            </Link>
          ))}
        </Alert>
      )
    case 'VALIDATION_FAILED':
      return (
        <Alert tone="warning" live title="Some details need attention">
          {error.message}{' '}
          {error.memberNumber && (
            <Link to={`/register/member/${error.memberNumber}`} className={linkClass}>
              Edit member {error.memberNumber}
            </Link>
          )}
        </Alert>
      )
    case 'NETWORK_ERROR':
      return (
        <Alert
          tone="danger"
          live
          title="Couldn't reach the server"
          action={
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          }
        >
          Check your internet connection. Your details are still saved on this device.
        </Alert>
      )
    default:
      return (
        <Alert tone="danger" live title="Submission failed">
          Something went wrong. Please try again, or call {EVENT.helplineDisplay}.
        </Alert>
      )
  }
}
