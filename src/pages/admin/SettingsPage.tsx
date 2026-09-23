import { CircleCheck, Lock, LockOpen } from 'lucide-react'
import { useState } from 'react'
import { useLoaderData, useRevalidator } from 'react-router'
import type { settingsLoader } from '@/app/loaders'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Pill } from '@/components/ui/StatusBadge'
import { ExportActions } from '@/features/admin/ExportActions'
import { OrphanUploads } from '@/features/admin/OrphanUploads'
import { adminService } from '@/services'

export default function SettingsPage() {
  const { settings, orphanUploads } = useLoaderData<typeof settingsLoader>()
  const revalidator = useRevalidator()
  const [confirmClose, setConfirmClose] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const open = settings.registrationOpen

  async function setOpen(next: boolean) {
    setSaving(true)
    setFailed(false)
    try {
      await adminService.setRegistrationOpen(next)
      setConfirmClose(false)
      await revalidator.revalidate()
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-title font-semibold text-ink">Settings</h1>

      <section aria-labelledby="reg-status" className="card flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="reg-status" className="text-heading font-semibold text-ink">
            Registration status
          </h2>
          {open ? (
            <Pill icon={<CircleCheck />} className="border-success-line bg-success-bg text-success">
              Open
            </Pill>
          ) : (
            <Pill icon={<Lock />} className="border-danger-line bg-danger-bg text-danger">
              Closed
            </Pill>
          )}
        </div>
        <p className="text-body text-ink-muted">
          <span className="tabular">
            {settings.registeredTeams} of {settings.maximumTeams}
          </span>{' '}
          team slots filled.{' '}
          {open
            ? 'New teams can register until all slots are filled or you close registration.'
            : 'The public site shows “Registration has been closed by the organisers.”'}
        </p>
        {open ? (
          <Button variant="secondary" className="self-start" icon={<Lock aria-hidden className="size-5" />} onClick={() => setConfirmClose(true)}>
            Close registration
          </Button>
        ) : (
          <Button className="self-start" loading={saving} icon={<LockOpen aria-hidden className="size-5" />} onClick={() => void setOpen(true)}>
            Reopen registration
          </Button>
        )}
        {failed && (
          <Alert tone="danger" live>
            Couldn't update registration status. Please try again.
          </Alert>
        )}
      </section>

      <section aria-labelledby="exports" className="card flex flex-col gap-3 p-4 sm:p-6">
        <h2 id="exports" className="text-heading font-semibold text-ink">
          Exports
        </h2>
        <p className="text-body text-ink-muted">CSV files contain personal data. Store and share them carefully.</p>
        <ExportActions />
      </section>

      <OrphanUploads paths={orphanUploads} />

      <Dialog
        open={confirmClose}
        onClose={() => !saving && setConfirmClose(false)}
        title="Close Registration?"
        description="New teams will no longer be able to register."
        footer={
          <>
            <Button variant="secondary" disabled={saving} onClick={() => setConfirmClose(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={saving} onClick={() => void setOpen(false)}>
              Close Registration
            </Button>
          </>
        }
      />
    </div>
  )
}
