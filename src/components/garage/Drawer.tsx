import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type DrawerProps = {
  title: string
  hint?: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function Drawer({ title, hint, open, onClose, children }: DrawerProps) {
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
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="garage-drawer-title"
        className="garage-panel fixed inset-y-0 right-0 flex h-dvh w-full max-w-xl flex-col border-l border-garage-border shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-garage-border px-5 py-4">
          <div className="min-w-0">
            {hint ? <p className="label-caps">{hint}</p> : null}
            <h2 id="garage-drawer-title" className="mt-1 truncate text-lg font-semibold">
              {title}
            </h2>
          </div>
          <button type="button" className="btn px-2" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </aside>
    </div>,
    document.body,
  )
}
