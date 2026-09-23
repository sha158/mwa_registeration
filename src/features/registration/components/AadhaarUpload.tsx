import { CircleCheck, FileText, LockKeyhole, RotateCcw, Upload } from 'lucide-react'
import { useId, useRef, useState, type Ref } from 'react'
import { Button } from '@/components/ui/Button'
import { FieldError } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/Spinner'
import { documentService } from '@/services'
import type { DocumentRef, MemberNumber } from '@/types/domain'
import { cn } from '@/utils/cn'
import { formatFileSize } from '@/utils/format'
import { AADHAAR_ACCEPT, validateAadhaarFile } from '@/validation/file'

type UploadState = { status: 'idle' } | { status: 'uploading'; fileName: string } | { status: 'failed'; message: string }

interface AadhaarUploadProps {
  memberNumber: MemberNumber
  value: DocumentRef | null
  onChange: (value: DocumentRef | null) => void
  onBlur?: () => void
  /** Validation error from the form (e.g. missing upload). */
  error?: string
  /** Lets the form focus this control when it is the first invalid field. */
  focusRef?: Ref<HTMLButtonElement>
}

export function AadhaarUpload({ memberNumber, value, onChange, onBlur, error, focusRef }: AadhaarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>({ status: 'idle' })
  const [dragging, setDragging] = useState(false)
  const id = useId()
  const errorId = `${id}-error`
  const shownError = state.status === 'failed' ? state.message : error

  async function handleFile(file: File | undefined) {
    if (!file) return
    const problem = validateAadhaarFile(file)
    if (problem) {
      setState({ status: 'failed', message: problem })
      return
    }
    setState({ status: 'uploading', fileName: file.name })
    try {
      const ref = await documentService.uploadAadhaar(file, memberNumber)
      setState({ status: 'idle' })
      onChange(ref)
    } catch {
      setState({ status: 'failed', message: 'Upload failed. Please check your connection and try again.' })
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const pick = () => inputRef.current?.click()

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={AADHAAR_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {state.status === 'uploading' ? (
        <div role="status" className="flex items-center gap-3 rounded-card bg-surface-low p-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-control bg-surface-high text-brand">
            <Spinner />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-label font-semibold text-ink">{state.fileName}</span>
            <span className="text-small text-ink-muted">Uploading securely…</span>
          </div>
        </div>
      ) : value ? (
        <div className="flex items-center justify-between gap-3 rounded-card bg-surface-low p-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-control bg-brand text-white">
              <FileText className="size-6" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="flex items-center gap-1 text-label font-semibold text-success">
                <CircleCheck aria-hidden className="size-4" />
                Aadhaar uploaded
              </span>
              <span className="truncate text-small text-ink-muted">
                {value.fileName} · {formatFileSize(value.sizeBytes)}
              </span>
            </div>
          </div>
          <Button ref={focusRef} variant="secondary" size="sm" onClick={pick} onBlur={onBlur} aria-label="Change Aadhaar file">
            Change
          </Button>
        </div>
      ) : (
        <button
          ref={focusRef}
          type="button"
          onClick={pick}
          onBlur={onBlur}
          aria-describedby={shownError ? errorId : undefined}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            void handleFile(e.dataTransfer.files[0])
          }}
          className={cn(
            'flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-card border-[1.5px] border-dashed p-5 text-center transition-colors',
            'hover:border-ring hover:bg-surface-low',
            dragging ? 'border-ring bg-surface-low' : shownError ? 'border-danger-strong bg-surface' : 'border-line-strong bg-surface',
          )}
        >
          <span aria-hidden className="grid size-11 place-items-center rounded-full bg-brand-tint text-brand">
            {state.status === 'failed' ? <RotateCcw className="size-5" /> : <Upload className="size-5" />}
          </span>
          <span className="text-label font-semibold text-brand">
            {state.status === 'failed' ? 'Choose another file' : 'Upload Aadhaar card'}
          </span>
          <span className="text-small text-ink-subtle">JPG, PNG or PDF · max 2 MB</span>
        </button>
      )}

      <FieldError id={errorId} message={shownError} />

      <p className="flex items-start gap-2 text-small text-ink-muted">
        <LockKeyhole aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
        Stored privately and used only to verify age and identity. It is never shown publicly.
      </p>
    </div>
  )
}
