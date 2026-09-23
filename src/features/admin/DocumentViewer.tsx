import { useState } from 'react'
import { Eye } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Spinner } from '@/components/ui/Spinner'
import { documentService, type SignedDocumentUrl } from '@/services'
import type { DocumentRef } from '@/types/domain'

type ViewerState =
  | { status: 'closed' }
  | { status: 'loading' }
  | { status: 'ready'; signed: SignedDocumentUrl }
  | { status: 'failed' }

/** Fetches a short-lived signed URL on demand and releases it when the viewer closes. */
export function DocumentViewer({ document, memberName }: { document: DocumentRef; memberName: string }) {
  const [state, setState] = useState<ViewerState>({ status: 'closed' })
  const isPdf = document.fileName.toLowerCase().endsWith('.pdf') && !document.uploadId.startsWith('seed-')

  async function open() {
    setState({ status: 'loading' })
    try {
      setState({ status: 'ready', signed: await documentService.getSignedUrl(document.uploadId) })
    } catch {
      setState({ status: 'failed' })
    }
  }

  function close() {
    if (state.status === 'ready') state.signed.release()
    setState({ status: 'closed' })
  }

  return (
    <>
      <Button variant="subtle" size="sm" icon={<Eye aria-hidden className="size-4" />} onClick={() => void open()}>
        View document
      </Button>
      <Dialog open={state.status !== 'closed'} onClose={close} title={`Aadhaar — ${memberName}`} description={document.fileName}>
        {state.status === 'loading' && (
          <div className="grid h-48 place-items-center text-brand">
            <Spinner label="Loading document" />
          </div>
        )}
        {state.status === 'failed' && (
          <Alert tone="danger" live>
            The document couldn't be loaded. It may have expired — close and try again.
          </Alert>
        )}
        {state.status === 'ready' &&
          (isPdf ? (
            <iframe title={`Aadhaar document for ${memberName}`} src={state.signed.url} className="h-[60vh] w-full rounded-control border border-line" />
          ) : (
            <img src={state.signed.url} alt={`Aadhaar document for ${memberName}`} className="max-h-[60vh] w-full rounded-control object-contain" />
          ))}
      </Dialog>
    </>
  )
}
