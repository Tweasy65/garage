import { useEffect, useState } from 'react'

import Drawer from '@/components/garage/Drawer'
import {
  PROJECT_AREA_LABELS,
  PROJECT_AREAS,
  type ProjectArea,
} from '@/lib/projectItems'
import type { ProjectItem } from '@/lib/vehicleTypes'

type ProjectItemDetailDrawerProps = {
  item: ProjectItem | null
  open: boolean
  onClose: () => void
  onSave: (id: string, values: {
    title: string
    notes: string | null
    instructionsMd: string | null
    area: ProjectArea
  }) => Promise<void>
}

export default function ProjectItemDetailDrawer({
  item,
  open,
  onClose,
  onSave,
}: ProjectItemDetailDrawerProps) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [instructionsMd, setInstructionsMd] = useState('')
  const [area, setArea] = useState<ProjectArea>('misc')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!item) return
    setTitle(item.title)
    setNotes(item.notes ?? '')
    setInstructionsMd(item.instructionsMd ?? '')
    setArea(item.area)
    setError(null)
  }, [item?.id, open])

  if (!item) return null

  const itemId = item.id

  async function handleSave() {
    const nextTitle = title.trim()
    if (!nextTitle || pending) return
    setPending(true)
    setError(null)
    try {
      await onSave(itemId, {
        title: nextTitle,
        notes: notes.trim() || null,
        instructionsMd: instructionsMd.trim() || null,
        area,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setPending(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      hint={PROJECT_AREA_LABELS[item.area]}
      title={item.title}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <label className="block">
            <span className="label-caps">Title</span>
            <input
              className="field mt-1.5"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="label-caps">Category</span>
            <select
              className="field mt-1.5"
              value={area}
              onChange={(event) => setArea(event.target.value as ProjectArea)}
            >
              {PROJECT_AREAS.map((value) => (
                <option key={value} value={value}>
                  {PROJECT_AREA_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-caps">Short note</span>
            <input
              className="field mt-1.5"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="One line on the cardboard"
            />
          </label>
          <label className="block">
            <span className="label-caps">Instructions</span>
            <textarea
              className="field mt-1.5 min-h-64 font-mono text-[13px] leading-relaxed"
              value={instructionsMd}
              onChange={(event) => setInstructionsMd(event.target.value)}
              placeholder={'# Steps\n\n- Parts\n- Torque\n- Don’t forget'}
            />
            <span className="mt-1.5 block text-xs text-garage-muted">
              Markdown is fine. This is the write-up behind the cardboard line.
            </span>
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>
        <div className="mt-auto flex flex-wrap gap-2 border-t border-garage-border px-5 py-4">
          <button
            type="button"
            className="btn-primary"
            onClick={() => void handleSave()}
            disabled={pending || !title.trim()}
          >
            Save details
          </button>
          <button type="button" className="btn" onClick={onClose} disabled={pending}>
            Close
          </button>
        </div>
      </div>
    </Drawer>
  )
}
