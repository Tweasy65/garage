import {
  Link,
  createFileRoute,
  getRouteApi,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'

import { Trash2 } from 'lucide-react'

import Modal from '@/components/garage/Modal'
import VehicleForm from '@/components/garage/VehicleForm'
import { formatDate } from '@/lib/format'
import { vehicleToInput } from '@/lib/vehicleFormValues'
import type { VehicleDetail, VehicleInput } from '@/lib/vehicleTypes'
import { deleteVehicle, updateVehicle } from '@/server/vehicles'

const vehicleRoute = getRouteApi('/vehicles/$vehicleId')

export const Route = createFileRoute('/vehicles/$vehicleId/')({
  validateSearch: (search: Record<string, unknown>): { edit?: boolean } => ({
    edit:
      search.edit === true || search.edit === '1' || search.edit === 'true'
        ? true
        : undefined,
  }),
  component: VehicleOverviewPage,
})

function VehicleOverviewPage() {
  const { vehicle } = vehicleRoute.useLoaderData()
  const { edit } = Route.useSearch()
  const navigate = useNavigate({ from: '/vehicles/$vehicleId/' })
  const router = useRouter()

  async function handleUpdate(values: VehicleInput) {
    await updateVehicle({ data: { ...values, id: vehicle.id } })
    await router.invalidate()
    await navigate({ search: {}, replace: true })
  }

  async function handleDelete() {
    if (!window.confirm('Delete this vehicle and all maintenance records?')) {
      return
    }
    await deleteVehicle({ data: { id: vehicle.id } })
    await router.invalidate()
    await router.navigate({ to: '/' })
  }

  return (
    <div className="space-y-6 p-6">
      <DetailGrid vehicle={vehicle} />
      {vehicle.notes ? (
        <div>
          <p className="label-caps mb-2">Notes</p>
          <p className="text-sm leading-relaxed text-garage-muted">
            {vehicle.notes}
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void navigate({ search: { edit: true } })}
          className="btn"
        >
          Edit vehicle
        </button>
        <Link
          to="/service"
          search={{ vehicle: vehicle.id }}
          className="btn"
        >
          Service
        </Link>
        <button
          type="button"
          onClick={() => void handleDelete()}
          className="btn text-red-300"
        >
          <Trash2 className="size-4" />
          Delete
        </button>
      </div>
      <Modal
        open={Boolean(edit)}
        onClose={() => void navigate({ search: {}, replace: true })}
        size="lg"
        hint="Edit"
        title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      >
        <VehicleForm
          submitLabel="Save changes"
          initial={vehicleToInput(vehicle)}
          onSubmit={handleUpdate}
          onCancel={() => void navigate({ search: {}, replace: true })}
        />
      </Modal>
    </div>
  )
}

function DetailGrid({ vehicle }: { vehicle: VehicleDetail }) {
  const items = [
    ['VIN', vehicle.vin],
    ['License plate', vehicle.licensePlate],
    ['Body style', vehicle.bodyStyle],
    ['Transmission', vehicle.transmission],
    ['Fuel type', vehicle.fuelType],
    ['Drivetrain', vehicle.drivetrain],
    ['Engine', vehicle.engineType],
    ['Purchase date', formatDate(vehicle.purchaseDate)],
    ['Title status', vehicle.titleStatus],
  ].filter(([, value]) => value)

  if (items.length === 0) {
    return (
      <p className="text-sm text-garage-muted">
        Add specs, VIN, or a purchase date by editing this vehicle.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label}>
          <p className="label-caps">{label}</p>
          <p className="mt-1 font-medium">{value}</p>
        </div>
      ))}
    </div>
  )
}
