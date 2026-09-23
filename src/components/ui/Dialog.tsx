import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
}

/**
 * Modal built on native <dialog>: focus trapping, Escape handling and inert background
 * come from the browser. Renders as a bottom sheet on small screens.
 */
export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

  // Syncing with the imperative <dialog> API is a legitimate effect.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    // Backdrop click is a pointer convenience; keyboard users close with Escape (native).
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="m-0 mt-auto w-full max-w-none rounded-t-2xl bg-surface p-0 text-ink shadow-float backdrop:bg-ink/40 sm:m-auto sm:max-w-md sm:rounded-card"
    >
      <div className="flex flex-col gap-4 p-5 pb-safe sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-heading font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-body text-ink-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 -mr-2 grid size-11 shrink-0 place-items-center rounded-full text-ink-subtle hover:bg-surface-low"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        {children}
        {footer && <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </dialog>
  )
}
