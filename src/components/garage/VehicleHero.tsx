import { useRouter } from '@tanstack/react-router'
import { Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'

import Modal from '@/components/garage/Modal'
import VehicleModelCanvas from '@/components/garage/VehicleModelCanvas'
import VehicleThumb from '@/components/garage/VehicleThumb'
import { paintColorFromName, specForVehicle } from '@/data/vehicleModels'
import { computeMaintenanceAlerts } from '@/lib/maintenanceAlerts'
import { formatMiles } from '@/lib/format'
import type { VehicleDetail } from '@/lib/vehicleTypes'
import { updateVehicleMileage } from '@/server/vehicles'

export default function VehicleHero({ vehicle }: { vehicle: VehicleDetail }) {
  const spec = specForVehicle(vehicle)
  const router = useRouter()
  const [mileageOpen, setMileageOpen] = useState(false)
  const [mileageValue, setMileageValue] = useState(String(vehicle.mileage))
  const [mileageError, setMileageError] = useState<string | null>(null)
  const [mileagePending, setMileagePending] = useState(false)

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

  async function saveMileage() {
    const next = Number(mileageValue.replace(/,/g, ''))
    if (!Number.isFinite(next) || next < 0) {
      setMileageError('Enter a valid odometer reading')
      return
    }
    if (next < vehicle.mileage) {
      const ok = window.confirm(
        `New mileage (${formatMiles(next)}) is lower than the current reading (${formatMiles(vehicle.mileage)}). Save anyway?`,
      )
      if (!ok) return
    }
    setMileagePending(true)
    setMileageError(null)
    try {
      await updateVehicleMileage({ data: { id: vehicle.id, mileage: next } })
      await router.invalidate()
      setMileageOpen(false)
    } catch (err) {
      setMileageError(err instanceof Error ? err.message : 'Could not update mileage')
    } finally {
      setMileagePending(false)
    }
  }

  return (
    <>
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
              <div>
                <p className="label-caps">Odometer</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-medium tabular-nums">{formatMiles(vehicle.mileage)}</p>
                  <button
                    type="button"
                    className="rounded-sm p-1 text-garage-muted transition hover:bg-white/10 hover:text-garage-text"
                    aria-label="Update odometer"
                    onClick={() => {
                      setMileageValue(String(vehicle.mileage))
                      setMileageError(null)
                      setMileageOpen(true)
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              </div>
              <Stat label="Records" value={String(vehicle.maintenance.length)} />
              <Stat label="Color" value={vehicle.color ?? '—'} />
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={mileageOpen}
        onClose={() => setMileageOpen(false)}
        size="md"
        hint="Odometer"
        title="Update mileage"
      >
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="label-caps mb-2 block">Miles</span>
            <input
              type="number"
              min={0}
              step={1}
              className="field"
              value={mileageValue}
              onChange={(e) => setMileageValue(e.target.value)}
            />
          </label>
          {mileageError ? (
            <p className="text-sm text-red-300">{mileageError}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setMileageOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={mileagePending}
              onClick={() => void saveMileage()}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </>
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
