import { Wrench } from 'lucide-react'

import { formatDate, formatMiles, formatMoney } from '@/lib/format'
import type { MaintenanceRecord } from '@/lib/vehicleTypes'

type ListedRecord = MaintenanceRecord & {
  vehicleLabel?: string
}

export default function MaintenanceList({
  records,
  showVehicle,
  onDelete,
}: {
  records: ListedRecord[]
  showVehicle?: boolean
  onDelete: (id: string) => void
}) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-garage-muted">
        No maintenance records yet. Log an oil change to start the clock.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {records.map((record) => (
        <div
          key={record.id}
          className="flex items-start justify-between gap-4 border border-garage-border p-4"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Wrench className="size-4 shrink-0 text-garage-muted" />
              <p className="font-medium">{record.type}</p>
            </div>
            {showVehicle && record.vehicleLabel ? (
              <p className="mt-1 text-sm text-garage-muted">{record.vehicleLabel}</p>
            ) : null}
            <p className="mt-1 text-sm text-garage-muted">
              {formatDate(record.date)}
              {record.mileage != null ? ` · ${formatMiles(record.mileage)}` : ''}
              {formatMoney(record.costCents)
                ? ` · ${formatMoney(record.costCents)}`
                : ''}
            </p>
            {record.serviceProvider ? (
              <p className="mt-1 text-sm text-garage-muted">
                {record.serviceProvider}
              </p>
            ) : null}
            {record.nextDueDate || record.nextDueMileage != null ? (
              <p className="mt-1 text-xs text-garage-muted">
                Next due
                {record.nextDueDate ? ` ${formatDate(record.nextDueDate)}` : ''}
                {record.nextDueMileage != null
                  ? ` · ${formatMiles(record.nextDueMileage)}`
                  : ''}
              </p>
            ) : null}
            {record.description ? (
              <p className="mt-2 text-sm text-garage-muted">{record.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onDelete(record.id)}
            className="shrink-0 text-sm text-garage-muted hover:text-red-300"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}
