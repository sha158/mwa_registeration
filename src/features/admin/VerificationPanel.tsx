import { CircleCheck, CircleX, RotateCcw } from 'lucide-react'
import { useId, useState } from 'react'
import { useRevalidator } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Textarea } from '@/components/ui/Input'
import { adminService, ServiceError } from '@/services'
import type { RegistrationStatus, Team } from '@/types/domain'

export function VerificationPanel({ team }: { team: Team }) {
  const revalidator = useRevalidator()
  const [pending, setPending] = useState<RegistrationStatus | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const noteId = useId()

  async function update(status: RegistrationStatus, adminNote?: string) {
    setPending(status)
    setFailure(null)
    try {
      await adminService.updateTeamStatus(team.id, status, adminNote)
      setRejecting(false)
      setNote('')
      await revalidator.revalidate()
    } catch (error) {
      setFailure(
        error instanceof ServiceError && error.code === 'REGISTRATION_FULL'
          ? 'All team slots are taken, so this team cannot be moved back to pending.'
          : "Couldn't update the team. Please try again.",
      )
    } finally {
      setPending(null)
    }
  }

  const busy = pending !== null

  return (
    <div className="flex flex-col gap-3">
      {team.status === 'submitted' ? (
        <>
          <Button
            loading={pending === 'verified'}
            disabled={busy}
            icon={<CircleCheck aria-hidden className="size-5" />}
            onClick={() => void update('verified')}
          >
            Verify team
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            icon={<CircleX aria-hidden className="size-5 text-danger-strong" />}
            onClick={() => setRejecting(true)}
          >
            Reject
          </Button>
        </>
      ) : (
        <Button
          variant="secondary"
          loading={pending === 'submitted'}
          disabled={busy}
          icon={<RotateCcw aria-hidden className="size-5" />}
          onClick={() => void update('submitted')}
        >
          Move back to pending
        </Button>
      )}
      {failure && (
        <Alert tone="danger" live>
          {failure}
        </Alert>
      )}

      <Dialog
        open={rejecting}
        onClose={() => !busy && setRejecting(false)}
        title={`Reject ${team.registrationNumber}?`}
        description="The team will lose its slot. You can move it back to pending later."
        footer={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={pending === 'rejected'} onClick={() => void update('rejected', note)}>
              Reject team
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor={noteId} className="text-label font-semibold text-ink">
            Reason / admin note <span className="font-normal text-ink-subtle">(optional)</span>
          </label>
          <Textarea id={noteId} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
        </div>
      </Dialog>
    </div>
  )
}
