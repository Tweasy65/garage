import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

import MaintenanceRecordDrawer, {
  type ListedMaintenanceRecord,
} from '@/components/garage/MaintenanceRecordDrawer'
import { formatDate, formatMiles, formatMoney } from '@/lib/format'
import type { MaintenanceInput } from '@/lib/vehicleTypes'

export default function MaintenanceList({
  records,
  showVehicle,
  onDelete,
  onUpdate,
}: {
  records: ListedMaintenanceRecord[]
  showVehicle?: boolean
  onDelete: (id: string) => void
  onUpdate: (id: string, values: MaintenanceInput) => Promise<void>
}) {
  const [selected, setSelected] = useState<ListedMaintenanceRecord | null>(null)

  if (records.length === 0) {
    return (
      <p className="text-sm text-garage-muted">
        No maintenance records yet. Log an oil change to start the clock.
      </p>
    )
  }

  return (
    <>
      <div className="service-table-wrap overflow-x-auto rounded-sm border border-garage-border">
        <table className="service-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Service</th>
              {showVehicle ? <th scope="col">Vehicle</th> : null}
              <th scope="col" className="hidden sm:table-cell">
                Miles
              </th>
              <th scope="col" className="hidden md:table-cell">
                Cost
              </th>
              <th scope="col" className="w-8">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.id}
                className="cursor-pointer"
                tabIndex={0}
                onClick={() => setSelected(record)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelected(record)
                  }
                }}
              >
                <td className="tabular-nums text-garage-muted">
                  {formatDate(record.date)}
                </td>
                <td className="font-medium">{record.type}</td>
                {showVehicle ? (
                  <td className="max-w-[10rem] truncate text-garage-muted">
                    {record.vehicleLabel ?? '—'}
                  </td>
                ) : null}
                <td className="hidden tabular-nums sm:table-cell">
                  {record.mileage != null ? formatMiles(record.mileage) : '—'}
                </td>
                <td className="hidden tabular-nums md:table-cell">
                  {formatMoney(record.costCents) || '—'}
                </td>
                <td className="text-garage-muted">
                  <ChevronRight className="size-4" aria-hidden />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MaintenanceRecordDrawer
        record={selected}
        open={selected != null}
        onClose={() => setSelected(null)}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />
    </>
  )
}
