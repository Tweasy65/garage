import { Link } from '@tanstack/react-router'
import { ArrowRight, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

import VehicleModelCanvas from '@/components/garage/VehicleModelCanvas'
import {
  FEATURED_MODEL,
  VEHICLE_MODELS,
  paintColorFromName,
  specForVehicle,
} from '@/data/vehicleModels'
import { formatMiles } from '@/lib/format'
import type { VehicleDetail, VehicleSummary } from '@/lib/vehicleTypes'

type VehiclePreviewProps = {
  vehicle: VehicleSummary | VehicleDetail | null
  pending?: boolean
  className?: string
}

export default function VehiclePreview({ vehicle, pending = false, className }: VehiclePreviewProps) {
  const matched = vehicle && !pending ? specForVehicle(vehicle) : null
  const spec = pending ? null : (matched ?? FEATURED_MODEL)
  const hasPoseParts = spec != null && VEHICLE_MODELS.some((model) => model.id === spec.id)
  const [hoodOpen, setHoodOpen] = useState(false)
  const [trunkOpen, setTrunkOpen] = useState(false)

  useEffect(() => {
    setHoodOpen(false)
    setTrunkOpen(false)
  }, [vehicle?.id])

  const title = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : `${FEATURED_MODEL.year} ${FEATURED_MODEL.make} ${FEATURED_MODEL.model}`
  const details = vehicle
    ? [
        formatMiles(vehicle.mileage),
        vehicle.trim,
        vehicle.color,
        vehicle.isProject ? 'Project' : null,
      ].filter(Boolean)
    : ['Featured model']

  return (
    <section className={`garage-panel overflow-hidden ${className ?? ''}`}>
      <div className="flex items-center justify-between gap-3 border-b border-garage-border px-4 py-3">
        <div className="min-w-0">
          <p className="label-caps">Preview</p>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold">{title}</h2>
            {vehicle?.isFavorite ? (
              <Star className="size-3.5 shrink-0 fill-garage-accent text-garage-accent" />
            ) : null}
          </div>
        </div>
        {hasPoseParts ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className={`btn px-3 text-xs ${hoodOpen ? 'border-garage-accent bg-white/10' : ''}`}
              onClick={() => setHoodOpen((open) => !open)}
            >
              Hood
            </button>
            <button
              type="button"
              className={`btn px-3 text-xs ${trunkOpen ? 'border-garage-accent bg-white/10' : ''}`}
              onClick={() => setTrunkOpen((open) => !open)}
            >
              Trunk
            </button>
          </div>
        ) : null}
      </div>

      <VehicleModelCanvas
        spec={spec}
        color={matched ? paintColorFromName(vehicle?.color) : paintColorFromName('red')}
        pose={{ hoodOpen, trunkOpen }}
        className="h-80 w-full md:h-96"
      />

      <div className="flex items-center justify-between gap-3 border-t border-garage-border px-4 py-3">
        <p className="min-w-0 truncate text-sm text-garage-muted">
          {details.join(' · ')}
          {matched || pending ? '' : ' · No 3D model yet'}
        </p>
        {vehicle ? (
          <Link
            to="/vehicles/$vehicleId"
            params={{ vehicleId: vehicle.id }}
            className="btn-primary shrink-0 px-3 text-xs"
          >
            View details
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </section>
  )
}
