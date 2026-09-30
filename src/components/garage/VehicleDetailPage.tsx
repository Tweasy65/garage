import { useNavigate, useRouter } from '@tanstack/react-router'

import Modal from '@/components/garage/Modal'
import VehicleForm from '@/components/garage/VehicleForm'
import VehicleMediaTab from '@/components/garage/VehicleMediaTab'
import VehicleOverviewTab from '@/components/garage/VehicleOverviewTab'
import VehicleServiceTab from '@/components/garage/VehicleServiceTab'
import { useVehicleDetailContext } from '@/components/garage/vehicleDetailContext'
import { vehicleToInput } from '@/lib/vehicleFormValues'
import type { MaintenanceInput, VehicleInput } from '@/lib/vehicleTypes'
import { addMaintenanceRecord, deleteMaintenanceRecord } from '@/server/maintenance'
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

  async function handleAddRecord(values: MaintenanceInput) {
    await addMaintenanceRecord({ data: values })
    await router.invalidate()
    await navigate({ search: (prev) => ({ ...prev, log: undefined }), replace: true })
  }

  async function handleDeleteRecord(id: string) {
    await deleteMaintenanceRecord({ data: { id } })
    await router.invalidate()
  }

  function openEdit() {
    void navigate({ search: (prev) => ({ ...prev, edit: true }) })
  }

  function openLogService() {
    void navigate({ search: (prev) => ({ ...prev, tab: 'service', log: true }) })
  }

  function closeEdit() {
    void navigate({ search: (prev) => ({ ...prev, edit: undefined }), replace: true })
  }

  function closeLog() {
    void navigate({ search: (prev) => ({ ...prev, log: undefined }), replace: true })
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
      ) : null}
      {tab === 'service' ? (
        <VehicleServiceTab
          vehicle={vehicle}
          logOpen={Boolean(search.log)}
          onOpenLog={openLogService}
          onCloseLog={closeLog}
          onAddRecord={handleAddRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      ) : null}
      {tab === 'media' ? (
        <VehicleMediaTab vehicle={vehicle} onEdit={openEdit} />
      ) : null}

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
