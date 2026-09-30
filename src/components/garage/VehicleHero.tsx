import VehicleModelCanvas from '@/components/garage/VehicleModelCanvas'
import VehicleThumb from '@/components/garage/VehicleThumb'
import { paintColorFromName, specForVehicle } from '@/data/vehicleModels'
import { formatMiles } from '@/lib/format'
import type { VehicleDetail } from '@/lib/vehicleTypes'

export default function VehicleHero({ vehicle }: { vehicle: VehicleDetail }) {
  const spec = specForVehicle(vehicle)
  return (
    <div className="garage-panel overflow-hidden">
      <div className="grid md:grid-cols-[1.1fr_1fr]">
        {spec ? (
          <VehicleModelCanvas
            spec={spec}
            color={paintColorFromName(vehicle.color)}
            className="min-h-56 md:min-h-full"
          />
        ) : (
          <VehicleThumb
            src={vehicle.imageUrl}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="min-h-56"
            iconClassName="size-12"
          />
        )}
        <div className="flex flex-col justify-between p-6">
          <div>
            <p className="label-caps">{vehicle.bodyStyle || 'Vehicle'}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            {vehicle.trim ? (
              <p className="mt-1 text-garage-muted">{vehicle.trim}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {vehicle.isFavorite ? <span className="badge">Favorite</span> : null}
              {vehicle.isProject ? <span className="badge">Project</span> : null}
              {spec ? <span className="badge">3D model</span> : null}
              {vehicle.tags.map((tag) => (
                <span key={tag} className="badge">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
            <Stat label="Odometer" value={formatMiles(vehicle.mileage)} />
            <Stat label="Records" value={String(vehicle.maintenanceCount)} />
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
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}
