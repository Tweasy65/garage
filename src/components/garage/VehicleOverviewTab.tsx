import { Trash2 } from 'lucide-react'

import { formatDate } from '@/lib/format'
import type { VehicleDetail } from '@/lib/vehicleTypes'

type VehicleOverviewTabProps = {
  vehicle: VehicleDetail
  onEdit: () => void
  onLogService: () => void
  onDelete: () => void
}

type SpecGroup = {
  title: string
  rows: [string, string | null | undefined][]
}

export default function VehicleOverviewTab({
  vehicle,
  onEdit,
  onLogService,
  onDelete,
}: VehicleOverviewTabProps) {
  const rawGroups: SpecGroup[] = [
    {
      title: 'Identity',
      rows: [
        ['VIN', vehicle.vin],
        ['License plate', vehicle.licensePlate],
        ['Title status', vehicle.titleStatus],
        ['Purchase date', formatDate(vehicle.purchaseDate)],
      ],
    },
    {
      title: 'Powertrain',
      rows: [
        ['Body style', vehicle.bodyStyle],
        [
          'Engine',
          [vehicle.engineType, vehicle.engineSize].filter(Boolean).join(' ') || null,
        ],
        ['Transmission', vehicle.transmission],
        ['Fuel type', vehicle.fuelType],
        ['Drivetrain', vehicle.drivetrain],
      ],
    },
    {
      title: 'Efficiency',
      rows: [
        [
          'MPG',
          vehicle.mpgCity != null && vehicle.mpgHighway != null
            ? `${vehicle.mpgCity} city / ${vehicle.mpgHighway} hwy`
            : null,
        ],
        [
          'Seating',
          vehicle.seatingCapacity != null ? String(vehicle.seatingCapacity) : null,
        ],
      ],
    },
  ]

  const groups = rawGroups
    .map((group) => ({
      title: group.title,
      rows: group.rows.filter((row) => Boolean(row[1])) as [string, string][],
    }))
    .filter((group) => group.rows.length > 0)

  return (
    <div role="tabpanel" id="vehicle-tab-overview" aria-labelledby="tab-overview">
      <div className="section-header">
        <div>
          <p className="label-caps">Overview</p>
          <h2 className="mt-1 text-base font-semibold">Specifications</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary px-3 text-xs" onClick={onLogService}>
            Log service
          </button>
          <button type="button" className="btn px-3 text-xs" onClick={onEdit}>
            Edit vehicle
          </button>
        </div>
      </div>

      <div className="section-body space-y-8">
        {groups.length === 0 ? (
          <p className="text-sm text-garage-muted">
            No specs yet. Use edit vehicle to add VIN, powertrain, and registration details.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.title}>
              <p className="label-caps mb-2">{group.title}</p>
              <dl className="data-rows">
                {group.rows.map(([label, value]) => (
                  <div key={label} className="data-row">
                    <dt className="data-row-label">{label}</dt>
                    <dd className="data-row-value">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))
        )}

        {vehicle.notes ? (
          <div>
            <p className="label-caps mb-2">Notes</p>
            <p className="max-w-prose text-sm leading-relaxed text-garage-muted">
              {vehicle.notes}
            </p>
          </div>
        ) : null}

        {vehicle.tags.length > 0 ? (
          <div>
            <p className="label-caps mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {vehicle.tags.map((tag) => (
                <span key={tag} className="badge">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-garage-border px-6 py-5">
        <p className="label-caps text-red-300/80">Danger zone</p>
        <p className="mt-2 max-w-prose text-sm text-garage-muted">
          Deleting removes this vehicle and every maintenance record tied to it.
        </p>
        <button
          type="button"
          onClick={onDelete}
          className="btn mt-4 border-red-400/30 text-red-300 hover:bg-red-400/10"
        >
          <Trash2 className="size-4" />
          Delete vehicle
        </button>
      </div>
    </div>
  )
}
