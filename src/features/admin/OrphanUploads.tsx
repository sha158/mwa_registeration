import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services'

/** Aadhaar files uploaded more than a day ago but never attached to a submitted registration. */
export function OrphanUploads({ paths }: { paths: string[] }) {
  const revalidator = useRevalidator()
  const [removing, setRemoving] = useState(false)
  const [failed, setFailed] = useState(false)

  async function remove() {
    setRemoving(true)
    setFailed(false)
    try {
      await adminService.removeUploads(paths)
      await revalidator.revalidate()
    } catch {
      setFailed(true)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <section aria-labelledby="orphans" className="card flex flex-col gap-3 p-4 sm:p-6">
      <h2 id="orphans" className="text-heading font-semibold text-ink">
        Abandoned uploads
      </h2>
      <p className="text-body text-ink-muted">
        {paths.length === 0
          ? 'No abandoned Aadhaar uploads.'
          : `${paths.length} Aadhaar ${paths.length === 1 ? 'file was' : 'files were'} uploaded more than a day ago but never submitted with a registration.`}
      </p>
      {paths.length > 0 && (
        <Button variant="secondary" size="sm" className="self-start" loading={removing} icon={<Trash2 aria-hidden className="size-4" />} onClick={() => void remove()}>
          Remove {paths.length} {paths.length === 1 ? 'file' : 'files'}
        </Button>
      )}
      {failed && (
        <Alert tone="danger" live>
          Couldn't remove the files. Please try again.
        </Alert>
      )}
    </section>
  )
}
