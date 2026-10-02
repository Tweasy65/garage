import { Link, useRouter } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import ProjectItemDetailDrawer from '@/components/garage/ProjectItemDetailDrawer'
import {
  PROJECT_AREA_LABELS,
  PROJECT_AREAS,
  sortProjectItems,
  type ProjectArea,
} from '@/lib/projectItems'
import type { ProjectItem, VehicleDetail } from '@/lib/vehicleTypes'
import {
  addProjectItem,
  updateProjectItem,
} from '@/server/projectItems'

export default function CardboardPage({ vehicle }: { vehicle: VehicleDetail }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const items = useMemo(
    () => sortProjectItems(vehicle.projectItems),
    [vehicle.projectItems],
  )
  const selected = items.find((item) => item.id === selectedId) ?? null
  const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  async function refresh() {
    await router.invalidate()
  }

  async function handleToggle(id: string, done: boolean) {
    await updateProjectItem({ data: { id, done } })
    await refresh()
  }

  async function handleAdd(input: {
    title: string
    notes?: string | null
    area: ProjectArea
  }) {
    await addProjectItem({
      data: { ...input, vehicleId: vehicle.id },
    })
    await refresh()
  }

  async function handleSaveDetails(
    id: string,
    values: {
      title: string
      notes: string | null
      instructionsMd: string | null
      area: ProjectArea
    },
  ) {
    await updateProjectItem({ data: { id, ...values } })
    await refresh()
  }

  return (
    <div className="cardboard-stage min-h-[calc(100vh-4.25rem)] px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <Link
          to="/vehicles/$vehicleId"
          params={{ vehicleId: vehicle.id }}
          search={{ tab: 'project' }}
          className="text-sm text-[#d8c4a0] hover:text-white"
        >
          ← Punch list
        </Link>
        <Link
          to="/projects"
          className="text-sm text-[#d8c4a0]/70 hover:text-white"
        >
          All projects
        </Link>
      </div>

      <article className="cardboard-sheet mx-auto mt-6 max-w-xl rotate-[-1.25deg] px-8 py-10 md:px-12 md:py-12">
        <span
          className="cardboard-tape -rotate-12"
          style={{ top: 18, left: -18 }}
          aria-hidden
        />
        <span
          className="cardboard-tape rotate-[18deg]"
          style={{ top: 22, right: -16 }}
          aria-hidden
        />

        <p className="cardboard-stamp text-[11px]">Project list</p>
        <h1 className="cardboard-title mt-3 text-5xl leading-none md:text-6xl">
          {label}
        </h1>
        {vehicle.trim ? (
          <p className="cardboard-stamp mt-2 text-xs opacity-70">{vehicle.trim}</p>
        ) : null}
        <p className="cardboard-stamp mt-4 text-[10px] opacity-50">
          Tap a line for details · box to cross off
        </p>

        {items.length === 0 ? (
          <p className="cardboard-marker mt-10 text-2xl leading-relaxed opacity-50">
            Nothing written down yet.
          </p>
        ) : (
          <ul className="mt-8 space-y-1">
            {items.map((item) => (
              <CardboardLine
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onOpen={() => setSelectedId(item.id)}
              />
            ))}
          </ul>
        )}

        <AddCardboardLine onAdd={handleAdd} />
      </article>

      <ProjectItemDetailDrawer
        item={selected}
        open={selected != null}
        onClose={() => setSelectedId(null)}
        onSave={handleSaveDetails}
      />
    </div>
  )
}

function wobble(id: string) {
  let n = 0
  for (const char of id) n = (n + char.charCodeAt(0)) % 13
  return (n - 6) * 0.28
}

function CardboardLine({
  item,
  onToggle,
  onOpen,
}: {
  item: ProjectItem
  onToggle: (id: string, done: boolean) => Promise<void>
  onOpen: () => void
}) {
  const [pending, setPending] = useState(false)

  async function toggle() {
    if (pending) return
    setPending(true)
    try {
      await onToggle(item.id, !item.done)
    } finally {
      setPending(false)
    }
  }

  return (
    <li
      className="flex items-start gap-3"
      style={{ transform: `rotate(${wobble(item.id)}deg)` }}
    >
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={pending}
        className="cardboard-marker mt-2 flex size-6 shrink-0 items-center justify-center border-2 border-[#1a120c] text-lg leading-none"
        aria-pressed={item.done}
        aria-label={item.done ? `Mark ${item.title} as not done` : `Cross off ${item.title}`}
      >
        {item.done ? '✕' : ''}
      </button>
      <button
        type="button"
        onClick={onOpen}
        className={`cardboard-marker cardboard-line min-w-0 flex-1 py-1 text-left text-[1.7rem] leading-snug md:text-[1.85rem] ${
          item.done ? 'cardboard-line-done' : ''
        }`}
      >
        {item.title}
        {item.notes ? (
          <span className="mt-0.5 block font-stamp text-[11px] tracking-wide opacity-60">
            {PROJECT_AREA_LABELS[item.area]} · {item.notes}
          </span>
        ) : (
          <span className="mt-0.5 block font-stamp text-[11px] tracking-wide opacity-40">
            {PROJECT_AREA_LABELS[item.area]}
          </span>
        )}
      </button>
    </li>
  )
}

function AddCardboardLine({
  onAdd,
}: {
  onAdd: (input: {
    title: string
    notes?: string | null
    area: ProjectArea
  }) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<ProjectArea>('misc')
  const [pending, setPending] = useState(false)

  async function submit() {
    const next = title.trim()
    if (!next || pending) return
    setPending(true)
    try {
      await onAdd({ title: next, area })
      setTitle('')
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      className="mt-8"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        <select
          className="cardboard-select text-xs uppercase tracking-widest"
          value={area}
          onChange={(event) => setArea(event.target.value as ProjectArea)}
          disabled={pending}
          aria-label="Category"
        >
          {PROJECT_AREAS.map((value) => (
            <option key={value} value={value}>
              {PROJECT_AREA_LABELS[value]}
            </option>
          ))}
        </select>
        <input
          className="cardboard-input min-w-0 flex-1 text-2xl"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="write the next thing…"
          disabled={pending}
          aria-label="Add to cardboard list"
        />
      </div>
    </form>
  )
}
