import { Download } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { useExport } from './useExport'

export function ExportActions() {
  const { pending, failed, run } = useExport()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="subtle"
          size="sm"
          loading={pending === 'teams'}
          icon={<Download aria-hidden className="size-4" />}
          onClick={() => void run('teams')}
        >
          Export Teams CSV
        </Button>
        <Button
          variant="subtle"
          size="sm"
          loading={pending === 'participants'}
          icon={<Download aria-hidden className="size-4" />}
          onClick={() => void run('participants')}
        >
          Export Participants CSV
        </Button>
      </div>
      {failed && (
        <Alert tone="danger" live>
          Export failed. Please try again.
        </Alert>
      )}
    </div>
  )
}
