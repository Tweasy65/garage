import { Link, useRouter } from '@tanstack/react-router'

import ProjectBoard from '@/components/garage/ProjectBoard'
import ProjectListLayoutToggle, {
  useProjectListLayout,
} from '@/components/garage/ProjectListLayoutToggle'
import type { ProjectArea } from '@/lib/projectItems'
import { openProjectCount } from '@/lib/projectItems'
import type { VehicleDetail } from '@/lib/vehicleTypes'
import {
  addProjectItem,
  deleteProjectItem,
  updateProjectItem,
} from '@/server/projectItems'

export default function VehicleProjectTab({
  vehicle,
}: {
  vehicle: VehicleDetail
}) {
  const router = useRouter()
  const [layout, setLayout] = useProjectListLayout()
  const open = openProjectCount(vehicle.projectItems)

  async function refresh() {
    await router.invalidate()
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

  async function handleToggle(id: string, done: boolean) {
    await updateProjectItem({ data: { id, done } })
    await refresh()
  }

  async function handleDelete(id: string) {
    await deleteProjectItem({ data: { id } })
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
    <div role="tabpanel" id="vehicle-tab-project" aria-labelledby="tab-project">
      <div className="section-header">
        <div>
          <p className="label-caps">Project</p>
          <h2 className="mt-1 text-base font-semibold">Punch list</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-garage-muted">
            {open} open · {vehicle.projectItems.length} total
          </p>
          <ProjectListLayoutToggle value={layout} onChange={setLayout} />
          <Link
            to="/projects/$vehicleId/cardboard"
            params={{ vehicleId: vehicle.id }}
            className="btn px-3 text-xs"
          >
            Cardboard
          </Link>
        </div>
      </div>
      <ProjectBoard
        items={vehicle.projectItems}
        layout={layout}
        onAdd={handleAdd}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onSaveDetails={handleSaveDetails}
      />
    </div>
  )
}
