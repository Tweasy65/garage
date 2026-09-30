import { useMemo } from 'react'

import VehicleModelCanvas from '@/components/garage/VehicleModelCanvas'
import VehicleThumb from '@/components/garage/VehicleThumb'
import { computeMaintenanceAlerts } from '@/lib/maintenanceAlerts'
import { paintColorFromName, specForVehicle } from '@/data/vehicleModels'
import { formatMiles } from '@/lib/format'
import type { VehicleDetail } from '@/lib/vehicleTypes'

export default function VehicleHero({ vehicle }: { vehicle: VehicleDetail }) {
  const spec = specForVehicle(vehicle)
  const serviceStatus = useMemo(() => {
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
    const alerts = computeMaintenanceAlerts(
      [summary],
      { [vehicle.id]: vehicle.maintenance },
    )
    return alerts[0] ?? null
  }, [vehicle])

  const statusLabel =
    serviceStatus?.severity === 'overdue'
      ? 'Service overdue'
      : serviceStatus?.severity === 'due-soon'
        ? 'Due soon'
        : serviceStatus?.severity === 'missing'
          ? 'Needs first log'
          : null

  const statusClass =
    serviceStatus?.severity === 'overdue'
      ? 'border-red-400/40 text-red-200'
      : serviceStatus?.severity === 'due-soon'
        ? 'border-amber-400/40 text-amber-200'
        : 'border-garage-border text-garage-muted'

  return (
    <div className="garage-panel overflow-hidden">
      <div className="grid md:grid-cols-[1.15fr_1fr]">
        {spec ? (
          <VehicleModelCanvas
            spec={spec}
            color={paintColorFromName(vehicle.color)}
            className="min-h-56 md:min-h-72"
          />
        ) : (
          <VehicleThumb
            src={vehicle.imageUrl}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="min-h-56 md:min-h-72"
            iconClassName="size-12"
          />
        )}
        <div className="flex flex-col justify-between gap-6 p-6 md:p-8">
          <div>
            <p className="label-caps">{vehicle.bodyStyle || 'Vehicle'}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            {vehicle.trim ? (
              <p className="mt-1 text-garage-muted">{vehicle.trim}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {statusLabel ? (
                <span
                  className={`badge border ${statusClass}`}
                  title={serviceStatus?.detail}
                >
                  {statusLabel}
                </span>
              ) : (
                <span className="badge border border-emerald-500/30 text-emerald-300">
                  Service current
                </span>
              )}
              {vehicle.isFavorite ? <span className="badge">Favorite</span> : null}
              {vehicle.isProject ? <span className="badge">Project</span> : null}
              {spec ? <span className="badge">3D</span> : null}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-garage-border pt-5 text-sm">
            <Stat label="Odometer" value={formatMiles(vehicle.mileage)} />
            <Stat label="Records" value={String(vehicle.maintenance.length)} />
            <Stat label="Color" value={vehicle.color ?? '—'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-caps">{label}</p>
      <p className="mt-1 font-medium tabular-nums">{value}</p>
    </div>
  )
}
