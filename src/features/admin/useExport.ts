import { useState } from 'react'
import { exportService } from '@/services'
import { downloadBlob } from '@/utils/format'

type ExportKind = 'teams' | 'participants'

export function useExport() {
  const [pending, setPending] = useState<ExportKind | null>(null)
  const [failed, setFailed] = useState(false)

  async function run(kind: ExportKind) {
    setPending(kind)
    setFailed(false)
    try {
      const blob = kind === 'teams' ? await exportService.teamsCsv() : await exportService.participantsCsv()
      downloadBlob(blob, `mwa-quiz-${kind}-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch {
      setFailed(true)
    } finally {
      setPending(null)
    }
  }

  return { pending, failed, run }
}
