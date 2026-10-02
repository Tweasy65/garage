import { Link, useRouter } from '@tanstack/react-router'

import PageShell from '@/components/garage/PageShell'
import ProjectBoard from '@/components/garage/ProjectBoard'
import ProjectListLayoutToggle, {
  useProjectListLayout,
  type ProjectListLayout,
} from '@/components/garage/ProjectListLayoutToggle'
import VehicleThumb from '@/components/garage/VehicleThumb'
import { openProjectCount, type ProjectArea } from '@/lib/projectItems'
import type { ProjectBoard as ProjectBoardData } from '@/lib/vehicleTypes'
import {
  addProjectItem,
  deleteProjectItem,
  updateProjectItem,
} from '@/server/projectItems'

export default function ProjectsPage({ boards }: { boards: ProjectBoardData[] }) {
  const router = useRouter()
  const [layout, setLayout] = useProjectListLayout()

  async function refresh() {
    await router.invalidate()
  }

  if (boards.length === 0) {
    return (
      <PageShell>
        <div className="garage-panel px-8 py-12 text-center">
          <p className="label-caps">Projects</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            No project cars yet
          </h1>
          <p className="mt-3 text-sm text-garage-muted">
            Edit a vehicle in Collection and check Project vehicle. Its cardboard
            list will show up here.
          </p>
          <Link to="/" className="btn-primary mt-8 inline-flex">
            Go to collection
          </Link>
        </div>
      </PageShell>
    )
  }

  const openTotal = boards.reduce(
    (sum, board) => sum + openProjectCount(board.items),
    0,
  )

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Projects</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {boards.length} project car{boards.length === 1 ? '' : 's'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-garage-muted">
            {openTotal} open item{openTotal === 1 ? '' : 's'}
          </p>
          <ProjectListLayoutToggle value={layout} onChange={setLayout} />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {boards.map((board) => (
          <ProjectVehicleCard
            key={board.vehicle.id}
            board={board}
            layout={layout}
            onRefresh={refresh}
          />
        ))}
      </div>
    </PageShell>
  )
}

function ProjectVehicleCard({
  board,
  layout,
  onRefresh,
}: {
  board: ProjectBoardData
  layout: ProjectListLayout
  onRefresh: () => Promise<void>
}) {
  const open = openProjectCount(board.items)
  const label = `${board.vehicle.year} ${board.vehicle.make} ${board.vehicle.model}`

  async function handleAdd(input: {
    title: string
    notes?: string | null
    area: ProjectArea
  }) {
    await addProjectItem({
      data: { ...input, vehicleId: board.vehicle.id },
    })
    await onRefresh()
  }

  async function handleToggle(id: string, done: boolean) {
    await updateProjectItem({ data: { id, done } })
    await onRefresh()
  }

  async function handleDelete(id: string) {
    await deleteProjectItem({ data: { id } })
    await onRefresh()
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
    await onRefresh()
  }

  return (
    <section className="garage-panel overflow-hidden">
      <div className="flex items-center gap-3 border-b border-garage-border p-4">
        <VehicleThumb
          src={board.vehicle.imageUrl}
          alt=""
          className="size-12 shrink-0 rounded-sm"
        />
        <div className="min-w-0 flex-1">
          <Link
            to="/vehicles/$vehicleId"
            params={{ vehicleId: board.vehicle.id }}
            search={{ tab: 'project' }}
            className="truncate font-medium hover:text-white"
          >
            {label}
          </Link>
          <p className="text-sm text-garage-muted">
            {open} open · {board.items.length} total
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Link
            to="/projects/$vehicleId/cardboard"
            params={{ vehicleId: board.vehicle.id }}
            className="text-xs text-garage-muted hover:text-garage-text"
          >
            Cardboard
          </Link>
          <Link
            to="/vehicles/$vehicleId"
            params={{ vehicleId: board.vehicle.id }}
            search={{ tab: 'project' }}
            className="text-xs text-garage-muted hover:text-garage-text"
          >
            Open
          </Link>
        </div>
      </div>
      <ProjectBoard
        items={board.items}
        layout={layout}
        onAdd={handleAdd}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onSaveDetails={handleSaveDetails}
      />
    </section>
  )
}
