import { Link } from '@tanstack/react-router'
import { AlertTriangle, Clock3, Info, Plus } from 'lucide-react'
import { useMemo } from 'react'

import MaintenanceForm from '@/components/garage/MaintenanceForm'
import MaintenanceList from '@/components/garage/MaintenanceList'
import Modal from '@/components/garage/Modal'
import { computeMaintenanceAlerts } from '@/lib/maintenanceAlerts'
import type { MaintenanceAlert } from '@/lib/maintenanceAlerts'
import type { MaintenanceInput, VehicleDetail } from '@/lib/vehicleTypes'

const alertIcon = {
  overdue: AlertTriangle,
  'due-soon': Clock3,
  missing: Info,
}

const alertClass = {
  overdue: 'border-red-400/30 bg-red-400/5 text-red-200',
  'due-soon': 'border-amber-400/30 bg-amber-400/5 text-amber-200',
  missing: 'border-garage-border bg-garage-panel-2 text-garage-muted',
}

type VehicleServiceTabProps = {
  vehicle: VehicleDetail
  logOpen: boolean
  onOpenLog: () => void
  onCloseLog: () => void
  onAddRecord: (values: MaintenanceInput) => Promise<void>
  onDeleteRecord: (id: string) => Promise<void>
}

export default function VehicleServiceTab({
  vehicle,
  logOpen,
  onOpenLog,
  onCloseLog,
  onAddRecord,
  onDeleteRecord,
}: VehicleServiceTabProps) {
  const alerts = useMemo(() => {
    const summary = {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      year: vehicle.year,
      color: vehicle.color,
      mileage: vehicle.mileage,
      isProject: vehicle.isProject,
      isFavorite: vehicle.isFavorite,
      imageUrl: vehicle.imageUrl,
      tags: vehicle.tags,
      maintenanceCount: vehicle.maintenance.length,
    }
    return computeMaintenanceAlerts(
      [summary],
      { [vehicle.id]: vehicle.maintenance },
    )
  }, [vehicle])

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
        {alerts.map((alert) => (
          <AlertBanner key={alert.id} alert={alert} />
        ))}

        <MaintenanceList
          records={vehicle.maintenance}
          onDelete={(id) => void onDeleteRecord(id)}
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

function AlertBanner({ alert }: { alert: MaintenanceAlert }) {
  const Icon = alertIcon[alert.severity]
  return (
    <div
      className={`flex items-start gap-3 rounded-sm border px-4 py-3 text-sm ${alertClass[alert.severity]}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">{alert.title}</p>
        <p className="mt-0.5 text-garage-muted">{alert.detail}</p>
      </div>
    </div>
  )
}
