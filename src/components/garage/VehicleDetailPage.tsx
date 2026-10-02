import { useNavigate, useRouter } from '@tanstack/react-router'

import Drawer from '@/components/garage/Drawer'
import { useGarageAlerts } from '@/components/garage/garageAlertsContext'
import VehicleForm from '@/components/garage/VehicleForm'
import VehicleMediaTab from '@/components/garage/VehicleMediaTab'
import VehicleOverviewTab from '@/components/garage/VehicleOverviewTab'
import VehicleProjectTab from '@/components/garage/VehicleProjectTab'
import VehicleServiceTab from '@/components/garage/VehicleServiceTab'
import { useVehicleDetailContext } from '@/components/garage/vehicleDetailContext'
import { vehicleToInput } from '@/lib/vehicleFormValues'
import type { MaintenanceInput, VehicleInput } from '@/lib/vehicleTypes'
import { addMaintenanceRecord, deleteMaintenanceRecord, updateMaintenanceRecord } from '@/server/maintenance'
import { deleteVehicle, updateVehicle } from '@/server/vehicles'

export default function VehicleDetailPage() {
  const { vehicle, search, tab } = useVehicleDetailContext()
  const activeTab =
    tab === 'project' && !vehicle.isProject ? 'specs' : tab
  const navigate = useNavigate({ from: '/vehicles/$vehicleId' })
  const router = useRouter()
  const { refreshAlerts } = useGarageAlerts()

  async function afterGarageChange() {
    await router.invalidate()
    await refreshAlerts()
  }

  async function handleUpdate(values: VehicleInput) {
    await updateVehicle({ data: { ...values, id: vehicle.id } })
    await afterGarageChange()
    await navigate({ search: (prev) => ({ ...prev, edit: undefined }), replace: true })
  }

  async function handleDelete() {
    if (!window.confirm('Delete this vehicle, its service history, and project list?')) return
    await deleteVehicle({ data: { id: vehicle.id } })
    await afterGarageChange()
    await router.navigate({ to: '/' })
  }

  async function handleAddRecord(values: MaintenanceInput) {
    await addMaintenanceRecord({ data: values })
    await afterGarageChange()
    await navigate({ search: (prev) => ({ ...prev, log: undefined }), replace: true })
  }

  async function handleDeleteRecord(id: string) {
    await deleteMaintenanceRecord({ data: { id } })
    await afterGarageChange()
  }

  async function handleUpdateRecord(id: string, values: MaintenanceInput) {
    await updateMaintenanceRecord({ data: { ...values, id } })
    await afterGarageChange()
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
      {activeTab === 'specs' ? (
        <VehicleOverviewTab
          vehicle={vehicle}
          onDelete={() => void handleDelete()}
        />
      ) : null}
      {activeTab === 'project' && vehicle.isProject ? (
        <VehicleProjectTab vehicle={vehicle} />
      ) : null}
      {activeTab === 'service' ? (
        <VehicleServiceTab
          vehicle={vehicle}
          logOpen={Boolean(search.log)}
          onOpenLog={openLogService}
          onCloseLog={closeLog}
          onAddRecord={handleAddRecord}
          onDeleteRecord={handleDeleteRecord}
          onUpdateRecord={handleUpdateRecord}
        />
      ) : null}
      {activeTab === 'media' ? (
        <VehicleMediaTab vehicle={vehicle} onEdit={openEdit} />
      ) : null}

      <Drawer
        open={Boolean(search.edit)}
        onClose={closeEdit}
        hint="Edit"
        title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      >
        <VehicleForm
          open={Boolean(search.edit)}
          entityId={vehicle.id}
          submitLabel="Save changes"
          initial={vehicleToInput(vehicle)}
          onSubmit={handleUpdate}
          onCancel={closeEdit}
        />
      </Drawer>
    </>
  )
}
