import { CircleCheck, FileText, ImageIcon, RotateCcw, Upload } from 'lucide-react'
import { useId, useRef, useState, type Ref } from 'react'
import { Button } from '@/components/ui/Button'
import { FieldError } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/Spinner'
import { AADHAAR_FILE, AADHAAR_UPLOAD } from '@/config/event'
import { documentService } from '@/services'
import type { DocumentRef, MemberNumber } from '@/types/domain'
import { cn } from '@/utils/cn'
import { formatFileSize } from '@/utils/format'
import { aadhaarAccept, checkAadhaarContents, validateAadhaarFile, type AadhaarUploadKind } from '@/validation/file'
import { useRegistrationStore } from '../store'

type UploadState = { status: 'idle' } | { status: 'uploading'; fileName: string } | { status: 'failed'; message: string }

interface DocumentUploadSlotProps {
  memberNumber: MemberNumber
  /** Which files this slot takes (photo or PDF). */
  kind: AadhaarUploadKind
  /** What this slot holds, e.g. "Front side", "Back side", "e-Aadhaar PDF". */
  label: string
  value: DocumentRef | null
  onChange: (value: DocumentRef | null) => void
  onBlur?: () => void
  /** Validation error from the form (e.g. missing upload). */
  error?: string
  /** Lets the form focus this control when it is the first invalid field. */
  focusRef?: Ref<HTMLButtonElement>
}

/** One private Aadhaar file upload: pick, check the bytes, upload, show the stored reference. */
export function DocumentUploadSlot({ memberNumber, kind, label, value, onChange, onBlur, error, focusRef }: DocumentUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>({ status: 'idle' })
  const [dragging, setDragging] = useState(false)
  const submissionId = useRegistrationStore((s) => s.submissionId)
  const id = useId()
  const errorId = `${id}-error`
  const shownError = state.status === 'failed' ? state.message : error
  const Icon = kind === 'pdf' ? FileText : ImageIcon

  async function handleFile(file: File | undefined) {
    if (!file) return
    const problem = validateAadhaarFile(file, kind) ?? (await checkAadhaarContents(file, kind))
    if (problem) {
      setState({ status: 'failed', message: problem })
      return
    }
    setState({ status: 'uploading', fileName: file.name })
    try {
      const ref = await documentService.uploadAadhaar(file, { submissionId, memberNumber })
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
    <div className="flex min-w-0 flex-col gap-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={aadhaarAccept(kind)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {state.status === 'uploading' ? (
        <div role="status" className="flex min-h-32 items-center gap-3 rounded-card bg-surface-low p-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-control bg-surface-high text-brand">
            <Spinner />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-caption font-semibold text-ink-muted">{label}</span>
            <span className="truncate text-label font-semibold text-ink">{state.fileName}</span>
            <span className="text-small text-ink-muted">Uploading securely…</span>
          </div>
        </div>
      ) : value ? (
        <div className="flex min-h-32 flex-col justify-between gap-3 rounded-card bg-surface-low p-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-control bg-brand text-white">
              <Icon className="size-6" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="flex items-center gap-1 text-label font-semibold text-success">
                <CircleCheck aria-hidden className="size-4 shrink-0" />
                {label} uploaded
              </span>
              <span className="truncate text-small text-ink-muted">
                {value.fileName} · {formatFileSize(value.sizeBytes)}
              </span>
            </div>
          </div>
          <Button
            ref={focusRef}
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={pick}
            onBlur={onBlur}
            aria-label={`Change ${label}`}
          >
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
            {label}
          </span>
          <span className="text-small text-ink-subtle">
            {state.status === 'failed' ? 'Choose another file' : 'Tap to upload'} · {AADHAAR_UPLOAD[kind].label} · max {AADHAAR_FILE.maxBytes / (1024 * 1024)} MB
          </span>
        </button>
      )}

      <FieldError id={errorId} message={shownError} />
    </div>
  )
}
