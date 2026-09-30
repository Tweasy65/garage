import { useNavigate, useRouter } from '@tanstack/react-router'

import Modal from '@/components/garage/Modal'
import VehicleForm from '@/components/garage/VehicleForm'
import VehicleOverviewTab from '@/components/garage/VehicleOverviewTab'
import { useVehicleDetailContext } from '@/components/garage/vehicleDetailContext'
import { vehicleToInput } from '@/lib/vehicleFormValues'
import type { VehicleInput } from '@/lib/vehicleTypes'
import { deleteVehicle, updateVehicle } from '@/server/vehicles'

export default function VehicleDetailPage() {
  const { vehicle, search, tab } = useVehicleDetailContext()
  const navigate = useNavigate({ from: '/vehicles/$vehicleId' })
  const router = useRouter()

  async function handleUpdate(values: VehicleInput) {
    await updateVehicle({ data: { ...values, id: vehicle.id } })
    await router.invalidate()
    await navigate({ search: (prev) => ({ ...prev, edit: undefined }), replace: true })
  }

  async function handleDelete() {
    if (!window.confirm('Delete this vehicle and all maintenance records?')) return
    await deleteVehicle({ data: { id: vehicle.id } })
    await router.invalidate()
    await router.navigate({ to: '/' })
  }

  function openEdit() {
    void navigate({ search: (prev) => ({ ...prev, edit: true }) })
  }

  function openLogService() {
    void navigate({ search: (prev) => ({ ...prev, tab: 'service' }) })
  }

  function closeEdit() {
    void navigate({ search: (prev) => ({ ...prev, edit: undefined }), replace: true })
  }

  return (
    <>
      {tab === 'overview' ? (
        <VehicleOverviewTab
          vehicle={vehicle}
          onEdit={openEdit}
          onLogService={openLogService}
          onDelete={() => void handleDelete()}
        />
      ) : (
        <div role="tabpanel" className="section-body text-sm text-garage-muted">
          <p>This tab is coming in the next update.</p>
        </div>
      )}

      <Modal
        open={Boolean(search.edit)}
        onClose={closeEdit}
        size="lg"
        hint="Edit"
        title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      >
        <VehicleForm
          submitLabel="Save changes"
          initial={vehicleToInput(vehicle)}
          onSubmit={handleUpdate}
          onCancel={closeEdit}
        />
      </Modal>
    </>
  )
}
