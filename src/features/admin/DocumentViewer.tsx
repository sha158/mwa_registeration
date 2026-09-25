import { useState } from 'react'
import { Download, Eye } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonAnchor } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Spinner } from '@/components/ui/Spinner'
import { likelyAadhaarPdfPassword } from '@/domain/aadhaarPassword'
import { documentService, type SignedDocumentUrl } from '@/services'
import type { DocumentRef } from '@/types/domain'

type ViewerState =
  | { status: 'closed' }
  | { status: 'loading' }
  | { status: 'ready'; signed: SignedDocumentUrl }
  | { status: 'failed' }

const SIDES = {
  front: { button: 'View front', title: 'Aadhaar front' },
  back: { button: 'View back', title: 'Aadhaar back' },
  pdf: { button: 'View e-Aadhaar', title: 'e-Aadhaar PDF' },
} as const

interface DocumentViewerProps {
  /** Which Aadhaar document this is. */
  side: keyof typeof SIDES
  document: DocumentRef
  memberName: string
  dateOfBirth: string
}

/** Fetches a short-lived signed URL on demand and releases it when the viewer closes. */
export function DocumentViewer({ side, document, memberName, dateOfBirth }: DocumentViewerProps) {
  const { button, title } = SIDES[side]
  const [state, setState] = useState<ViewerState>({ status: 'closed' })
  const isPdf = document.mimeType === 'application/pdf'
  // Android Chrome has no inline PDF viewer: an iframe shows a dead "Open" placeholder there.
  const canPreviewPdf = typeof navigator !== 'undefined' && navigator.pdfViewerEnabled === true

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
        {button}
      </Button>
      <Dialog
        open={state.status !== 'closed'}
        onClose={close}
        title={`${title} — ${memberName}`}
        description={document.fileName}
      >
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
            <div className="flex flex-col gap-3">
              {canPreviewPdf ? (
                <iframe title={`${title} for ${memberName}`} src={state.signed.url} className="h-[60vh] w-full rounded-control border border-line" />
              ) : (
                <p className="text-body text-ink-muted">This device can't preview PDFs here. Download the file to view it.</p>
              )}
              <PdfDownload url={state.signed.url} fileName={document.fileName} password={likelyAadhaarPdfPassword(memberName, dateOfBirth)} />
            </div>
          ) : (
            <img src={state.signed.url} alt={`${title} for ${memberName}`} className="max-h-[60vh] w-full rounded-control object-contain" />
          ))}
      </Dialog>
    </>
  )
}

function PdfDownload({ url, fileName, password }: { url: string; fileName: string; password: string | null }) {
  return (
    <div className="flex flex-col gap-2">
      <ButtonAnchor href={url} download={fileName} variant="primary" icon={<Download aria-hidden className="size-4" />}>
        Download PDF
      </ButtonAnchor>
      {password && (
        <p className="text-small text-ink-muted">
          If the PDF asks for a password, try <strong className="font-semibold text-ink tabular">{password}</strong>{' '}
          (e-Aadhaar: first 4 letters of the name in capitals + birth year).
        </p>
      )}
      <p className="text-small text-ink-muted">Delete the file from your Downloads after checking.</p>
    </div>
  )
}
