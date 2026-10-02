import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import ProjectItemDetailDrawer from '@/components/garage/ProjectItemDetailDrawer'
import type { ProjectListLayout } from '@/components/garage/ProjectListLayoutToggle'
import {
  itemsForArea,
  PROJECT_AREA_LABELS,
  PROJECT_AREAS,
  sortProjectItems,
  type ProjectArea,
} from '@/lib/projectItems'
import type { ProjectItem } from '@/lib/vehicleTypes'

type ProjectBoardProps = {
  items: ProjectItem[]
  layout?: ProjectListLayout
  onAdd: (input: {
    title: string
    notes?: string | null
    area: ProjectArea
  }) => Promise<void>
  onToggle: (id: string, done: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSaveDetails: (
    id: string,
    values: {
      title: string
      notes: string | null
      instructionsMd: string | null
      area: ProjectArea
    },
  ) => Promise<void>
}

export default function ProjectBoard({
  items,
  layout = 'category',
  onAdd,
  onToggle,
  onDelete,
  onSaveDetails,
}: ProjectBoardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = items.find((item) => item.id === selectedId) ?? null

  const list =
    layout === 'list' ? (
      <section className="px-4 py-4 md:px-5">
        {items.length === 0 ? (
          <p className="mb-3 text-sm text-garage-muted">Nothing on the list yet.</p>
        ) : (
          <ul className="space-y-1">
            {sortProjectItems(items).map((item) => (
              <ProjectItemRow
                key={item.id}
                item={item}
                showArea
                onToggle={onToggle}
                onDelete={onDelete}
                onOpen={() => setSelectedId(item.id)}
              />
            ))}
          </ul>
        )}
        <AddItemRow allowAreaSelect onAdd={onAdd} />
      </section>
    ) : (
      <div className="divide-y divide-garage-border">
        {PROJECT_AREAS.map((area) => (
          <ProjectAreaSection
            key={area}
            area={area}
            items={itemsForArea(items, area)}
            onAdd={onAdd}
            onToggle={onToggle}
            onDelete={onDelete}
            onOpen={(id) => setSelectedId(id)}
          />
        ))}
      </div>
    )

  return (
    <>
      {list}
      <ProjectItemDetailDrawer
        item={selected}
        open={selected != null}
        onClose={() => setSelectedId(null)}
        onSave={onSaveDetails}
      />
    </>
  )
}

function ProjectAreaSection({
  area,
  items,
  onAdd,
  onToggle,
  onDelete,
  onOpen,
}: {
  area: ProjectArea
  items: ProjectItem[]
  onAdd: ProjectBoardProps['onAdd']
  onToggle: ProjectBoardProps['onToggle']
  onDelete: ProjectBoardProps['onDelete']
  onOpen: (id: string) => void
}) {
  const openCount = items.filter((item) => !item.done).length

  return (
    <section className="px-4 py-4 md:px-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="label-caps">{PROJECT_AREA_LABELS[area]}</h3>
        <span className="text-[11px] tabular-nums text-garage-muted">
          {openCount} open
        </span>
      </div>
      <ul className="mt-3 space-y-1">
        {items.map((item) => (
          <ProjectItemRow
            key={item.id}
            item={item}
            onToggle={onToggle}
            onDelete={onDelete}
            onOpen={() => onOpen(item.id)}
          />
        ))}
      </ul>
      <AddItemRow area={area} onAdd={onAdd} />
    </section>
  )
}

function ProjectItemRow({
  item,
  showArea,
  onToggle,
  onDelete,
  onOpen,
}: {
  item: ProjectItem
  showArea?: boolean
  onToggle: ProjectBoardProps['onToggle']
  onDelete: ProjectBoardProps['onDelete']
  onOpen: () => void
}) {
  const [pending, setPending] = useState(false)

  async function toggle() {
    setPending(true)
    try {
      await onToggle(item.id, !item.done)
    } finally {
      setPending(false)
    }
  }

  async function remove() {
    if (!window.confirm('Remove this from the list?')) return
    setPending(true)
    try {
      await onDelete(item.id)
    } finally {
      setPending(false)
    }
  }

  return (
    <li className="group flex items-start gap-2 py-1">
      <input
        type="checkbox"
        checked={item.done}
        disabled={pending}
        onChange={() => void toggle()}
        className="mt-1 size-4 shrink-0 accent-garage-accent"
        aria-label={item.done ? `Mark ${item.title} as not done` : `Mark ${item.title} done`}
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          className={`block w-full text-left ${item.done ? 'project-item-done text-sm' : 'text-sm hover:text-white'}`}
          onClick={onOpen}
        >
          {item.title}
        </button>
        {showArea || item.notes ? (
          <button
            type="button"
            className="block w-full text-left text-xs text-garage-muted hover:text-garage-text"
            onClick={onOpen}
          >
            {showArea ? (
              <span className={item.done ? 'line-through' : undefined}>
                {PROJECT_AREA_LABELS[item.area]}
              </span>
            ) : null}
            {showArea && item.notes ? ' · ' : null}
            {item.notes ? (
              <span className={item.done ? 'line-through' : undefined}>
                {item.notes}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        className="mt-0.5 p-1 text-garage-muted opacity-100 transition hover:text-garage-text sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        onClick={() => void remove()}
        disabled={pending}
        aria-label={`Remove ${item.title}`}
      >
        <Trash2 className="size-3.5" />
      </button>
    </li>
  )
}

function AddItemRow({
  area = 'misc',
  allowAreaSelect,
  onAdd,
}: {
  area?: ProjectArea
  allowAreaSelect?: boolean
  onAdd: ProjectBoardProps['onAdd']
}) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedArea, setSelectedArea] = useState<ProjectArea>(area)
  const [showNotes, setShowNotes] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const nextTitle = title.trim()
    if (!nextTitle || pending) return
    setPending(true)
    setError(null)
    try {
      await onAdd({
        title: nextTitle,
        notes: notes.trim() || null,
        area: allowAreaSelect ? selectedArea : area,
      })
      setTitle('')
      setNotes('')
      setShowNotes(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add item')
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      className="mt-3"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <div className="flex flex-wrap gap-2">
        {allowAreaSelect ? (
          <select
            className="field w-auto"
            value={selectedArea}
            onChange={(event) => setSelectedArea(event.target.value as ProjectArea)}
            disabled={pending}
            aria-label="Category"
          >
            {PROJECT_AREAS.map((value) => (
              <option key={value} value={value}>
                {PROJECT_AREA_LABELS[value]}
              </option>
            ))}
          </select>
        ) : null}
        <input
          className="field min-w-0 flex-1"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={
            allowAreaSelect
              ? 'Add to the list'
              : `Add to ${PROJECT_AREA_LABELS[area].toLowerCase()}`
          }
          disabled={pending}
        />
        <button
          type="submit"
          className="btn shrink-0 px-3"
          disabled={pending || !title.trim()}
        >
          <Plus className="size-3.5" />
          Add
        </button>
      </div>
      {showNotes ? (
        <input
          className="field mt-2"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Note, part number, waiting on…"
          disabled={pending}
        />
      ) : (
        <button
          type="button"
          className="mt-1.5 text-xs text-garage-muted hover:text-garage-text"
          onClick={() => setShowNotes(true)}
        >
          Add a note
        </button>
      )}
      {error ? <p className="mt-1.5 text-xs text-red-300">{error}</p> : null}
    </form>
  )
}
