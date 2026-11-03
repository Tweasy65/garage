import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import MaintenanceForm from '@/components/garage/MaintenanceForm'
import MaintenanceList from '@/components/garage/MaintenanceList'
import Modal from '@/components/garage/Modal'
import { missingIntervalServices } from '@/lib/maintenanceAlerts'
import type { MaintenanceInput, VehicleDetail } from '@/lib/vehicleTypes'

type VehicleServiceTabProps = {
  vehicle: VehicleDetail
  logOpen: boolean
  onOpenLog: () => void
  onCloseLog: () => void
  onAddRecord: (values: MaintenanceInput) => Promise<void>
  onDeleteRecord: (id: string) => Promise<void>
  onUpdateRecord: (id: string, values: MaintenanceInput) => Promise<void>
}

export default function VehicleServiceTab({
  vehicle,
  logOpen,
  onOpenLog,
  onCloseLog,
  onAddRecord,
  onDeleteRecord,
  onUpdateRecord,
}: VehicleServiceTabProps) {
  const missing = missingIntervalServices(vehicle.maintenance)

  return (
    <div role="tabpanel" id="vehicle-tab-service" aria-labelledby="tab-service">
      <div className="section-header">
        <div>
          <p className="label-caps">Service</p>
          <h2 className="mt-1 text-base font-semibold">History</h2>
        </div>
        <button type="button" className="btn-primary px-3 text-xs" onClick={onOpenLog}>
          <Plus className="size-3.5" />
          Log service
        </button>
      </div>

      <div className="section-body space-y-5">
        {missing.length > 0 ? (
          <p className="text-sm text-garage-muted">
            No {joinList(missing)} on record yet. Log one to start tracking the
            next interval — this is not overdue.
          </p>
        ) : null}
        <MaintenanceList
          records={vehicle.maintenance}
          onDelete={(id) => void onDeleteRecord(id)}
          onUpdate={onUpdateRecord}
        />
      </div>

      <div className="border-t border-garage-border px-6 py-4">
        <Link
          to="/service"
          search={{ vehicle: vehicle.id }}
          className="text-sm text-garage-muted hover:text-garage-text"
        >
          View in fleet service table →
        </Link>
      </div>

      <Modal
        open={logOpen}
        onClose={onCloseLog}
        size="md"
        hint="Maintenance"
        title="Log service"
      >
        <MaintenanceForm
          vehicleId={vehicle.id}
          defaultMileage={vehicle.mileage}
          onSubmit={onAddRecord}
          onCancel={onCloseLog}
        />
      </Modal>
    </div>
  )
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} or ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, or ${items[items.length - 1]}`
}
