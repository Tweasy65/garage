import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type ModalProps = {
  title: string
  hint?: string
  open: boolean
  onClose: () => void
  size?: 'md' | 'lg'
  children: React.ReactNode
}

export default function Modal({
  title,
  hint,
  open,
  onClose,
  size = 'md',
  children,
}: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <button
        type="button"
        className="fixed inset-0 bg-black/70"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="garage-modal-title"
        className={`garage-panel relative z-10 my-4 w-full overflow-hidden ${
          size === 'lg' ? 'max-w-3xl' : 'max-w-xl'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-garage-border px-5 py-4">
          <div>
            {hint ? <p className="label-caps">{hint}</p> : null}
            <h2 id="garage-modal-title" className="mt-1 text-lg font-semibold">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="btn px-2"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[min(80dvh,40rem)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
