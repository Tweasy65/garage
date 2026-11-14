import { Link, useRouter } from '@tanstack/react-router'
import { Camera, Gauge, ListChecks, Pencil, RotateCw, SlidersHorizontal, Wrench } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import Modal from '@/components/garage/Modal'
import { useGarageAlerts } from '@/components/garage/garageAlertsContext'
import VehicleModelCanvas from '@/components/garage/VehicleModelCanvas'
import type { CameraView, CameraViewRequest } from '@/components/garage/VehicleModelViewer'
import VehicleThumb from '@/components/garage/VehicleThumb'
import { paintColorFromName, specForVehicle } from '@/data/vehicleModels'
import {
  actionableAlerts,
  computeMaintenanceAlerts,
} from '@/lib/maintenanceAlerts'
import { formatMiles } from '@/lib/format'
import type { VehicleDetail } from '@/lib/vehicleTypes'
import { updateVehicleMileage } from '@/server/vehicles'

const MAX_PHOTOS = 12

const VIEWS: { side: CameraView; label: string; name: string }[] = [
  { side: 'left', label: 'L', name: 'Left side' },
  { side: 'right', label: 'R', name: 'Right side' },
  { side: 'front', label: 'F', name: 'Front' },
  { side: 'back', label: 'B', name: 'Back' },
]

/** Fades the car's edges into the page so it reads as standing on it, not boxed in a frame. */
const STAGE_FADE = {
  maskImage: 'radial-gradient(ellipse 62% 56% at 50% 54%, #000 52%, transparent 100%)',
  WebkitMaskImage: 'radial-gradient(ellipse 62% 56% at 50% 54%, #000 52%, transparent 100%)',
}

/**
 * The top of a car's page: the car itself, large and free-standing with view buttons, its key
 * numbers, and beside it the four things you most often do plus the car's identifying details.
 */
export default function VehicleHero({
  vehicle,
  onEdit,
  onLogService,
  onManageMedia,
}: {
  vehicle: VehicleDetail
  onEdit?: () => void
  onLogService?: () => void
  onManageMedia?: () => void
}) {
  const spec = specForVehicle(vehicle)
  const router = useRouter()
  const { refreshAlerts } = useGarageAlerts()
  const [view, setView] = useState<CameraViewRequest | null>(null)
  const [mileageOpen, setMileageOpen] = useState(false)
  const [mileageValue, setMileageValue] = useState(String(vehicle.mileage))
  const [mileageError, setMileageError] = useState<string | null>(null)
  const [mileagePending, setMileagePending] = useState(false)

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const photoCount = vehicle.assets.filter((asset) => asset.kind === 'image').length
  const openItems = vehicle.projectItems.filter((item) => !item.done).length

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
    const alerts = actionableAlerts(
      computeMaintenanceAlerts([summary], { [vehicle.id]: vehicle.maintenance }),
    )
    return alerts[0] ?? null
  }, [vehicle])

  const statusLabel =
    serviceStatus?.severity === 'overdue'
      ? 'Service overdue'
      : serviceStatus?.severity === 'due-soon'
        ? 'Service due soon'
        : null

  const statusClass =
    serviceStatus?.severity === 'overdue'
      ? 'border-red-400/40 text-red-200'
      : 'border-amber-400/40 text-amber-200'

  const subtitle = [vehicle.trim, vehicle.color, vehicle.transmission].filter(Boolean).join(' · ')
  const eyebrow = [vehicle.bodyStyle, vehicle.drivetrain].filter(Boolean).join(' · ') || 'Vehicle'

  const stats: { label: string; value: string; unit?: string }[] = []
  if (vehicle.engineSize || vehicle.engineType) {
    stats.push({ label: 'Engine', value: vehicle.engineSize ?? vehicle.engineType ?? '', unit: vehicle.engineSize ? (vehicle.engineType ?? undefined) : undefined })
  }
  if (vehicle.transmission) stats.push({ label: 'Gearbox', value: vehicle.transmission })
  if (vehicle.drivetrain) stats.push({ label: 'Drive', value: vehicle.drivetrain })
  if (vehicle.mpgCity || vehicle.mpgHighway) {
    stats.push({ label: 'MPG', value: `${vehicle.mpgCity ?? '—'}/${vehicle.mpgHighway ?? '—'}`, unit: 'city/hwy' })
  } else if (vehicle.fuelType) {
    stats.push({ label: 'Fuel', value: vehicle.fuelType })
  }

  function openMileage() {
    setMileageValue(String(vehicle.mileage))
    setMileageError(null)
    setMileageOpen(true)
  }

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
      await refreshAlerts()
      setMileageOpen(false)
    } catch (err) {
      setMileageError(err instanceof Error ? err.message : 'Could not update mileage')
    } finally {
      setMileagePending(false)
    }
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="relative overflow-hidden" aria-label={title}>
          <p
            aria-hidden
            className="pointer-events-none absolute -top-6 right-0 select-none font-packaging text-[9rem] leading-none text-white/[0.035] sm:text-[13rem] lg:text-[16rem]"
          >
            {vehicle.make.toUpperCase()}
          </p>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="label-caps">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-[2.5rem] md:leading-tight">{title}</h1>
              {subtitle ? <p className="mt-1 text-[15px] text-garage-text/70">{subtitle}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {statusLabel ? (
                  <span className={`badge border ${statusClass}`} title={serviceStatus?.detail}>
                    {statusLabel}
                  </span>
                ) : (
                  <span className="badge border border-emerald-500/30 text-emerald-300">Service current</span>
                )}
                {vehicle.isFavorite ? <span className="badge">Favorite</span> : null}
                {vehicle.isProject ? <span className="badge">Project</span> : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {spec ? (
                  <>
                    {VIEWS.map((option) => (
                      <button
                        key={option.side}
                        type="button"
                        aria-label={`${option.name} view`}
                        aria-pressed={view?.side === option.side}
                        onClick={() => setView({ side: option.side, at: Date.now() })}
                        className={`flex size-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
                          view?.side === option.side
                            ? 'border-garage-text bg-garage-text text-garage-bg'
                            : 'border-garage-border bg-garage-panel-2 text-garage-text/80 hover:text-garage-text'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label="Spin the car"
                      aria-pressed={view === null}
                      onClick={() => setView(null)}
                      className={`flex size-9 items-center justify-center rounded-full border transition ${
                        view === null
                          ? 'border-garage-text bg-garage-text text-garage-bg'
                          : 'border-garage-border bg-garage-panel-2 text-garage-text/80 hover:text-garage-text'
                      }`}
                    >
                      <RotateCw className="size-4" />
                    </button>
                  </>
                ) : null}
                {photoCount > 0 ? (
                  <Link
                    to="/vehicles/$vehicleId"
                    params={{ vehicleId: vehicle.id }}
                    search={{ tab: 'media' }}
                    className="flex h-9 items-center rounded-full border border-garage-border bg-garage-panel-2 px-3.5 text-xs font-semibold tracking-wider text-garage-text/80 uppercase hover:text-garage-text"
                  >
                    {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
                  </Link>
                ) : null}
              </div>
            </div>
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                aria-label="Edit vehicle"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-garage-border bg-garage-panel-2 text-garage-muted transition hover:text-garage-text"
              >
                <Pencil className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="relative -mt-2 h-64 sm:h-80 lg:-mt-28 lg:ml-[18%] lg:h-[24rem]" style={STAGE_FADE}>
            {spec ? (
              <VehicleModelCanvas
                spec={spec}
                color={paintColorFromName(vehicle.color)}
                view={view}
                showControls={false}
                className="h-full"
              />
            ) : (
              <VehicleThumb src={vehicle.imageUrl} alt={title} className="h-full bg-transparent" iconClassName="size-14" />
            )}
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-garage-border pt-4 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <p className="label-caps">Odometer</p>
              <p className="mt-1 flex items-baseline gap-1.5 text-lg font-medium tabular-nums">
                {vehicle.mileage.toLocaleString()}
                <span className="text-xs font-normal text-garage-muted">mi</span>
                <button
                  type="button"
                  className="ml-0.5 self-center rounded-sm p-1 text-garage-muted transition hover:bg-white/10 hover:text-garage-text"
                  aria-label="Update odometer"
                  onClick={openMileage}
                >
                  <Pencil className="size-3.5" />
                </button>
              </p>
            </div>
            {stats.slice(0, 4).map((stat) => (
              <div key={stat.label} className="min-w-0">
                <p className="label-caps">{stat.label}</p>
                <p className="mt-1 truncate text-lg font-medium">
                  {stat.value}
                  {stat.unit ? <span className="ml-1.5 text-xs font-normal text-garage-muted">{stat.unit}</span> : null}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <section className="garage-panel p-4 sm:p-5">
            <h2 className="mb-3 text-base font-semibold">Quick actions</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {onLogService ? (
                <ActionTile
                  primary
                  icon={<Wrench className="size-5" />}
                  title="Log service"
                  hint={serviceStatus ? serviceStatus.title : `${vehicle.maintenance.length} on record`}
                  onClick={onLogService}
                />
              ) : null}
              <ActionTile
                icon={<Gauge className="size-5" />}
                title="Update mileage"
                hint={`Last: ${formatMiles(vehicle.mileage)}`}
                onClick={openMileage}
              />
              {onManageMedia ? (
                <ActionTile
                  icon={<Camera className="size-5" />}
                  title="Add photos"
                  hint={`${photoCount} of ${MAX_PHOTOS} used`}
                  onClick={onManageMedia}
                />
              ) : null}
              {vehicle.isProject ? (
                <ActionTile
                  icon={<ListChecks className="size-5" />}
                  title="Add part / to-do"
                  hint={openItems === 1 ? '1 open on the list' : `${openItems} open on the list`}
                  to={{ vehicleId: vehicle.id, tab: 'project' }}
                />
              ) : onEdit ? (
                <ActionTile
                  icon={<SlidersHorizontal className="size-5" />}
                  title="Edit details"
                  hint="Specs, plate and notes"
                  onClick={onEdit}
                />
              ) : null}
            </div>
          </section>

          <section className="garage-panel p-4 sm:p-5">
            <h2 className="mb-3 text-base font-semibold">At a glance</h2>
            <div className="flex flex-col gap-2.5">
              <GlanceRow label="Plate & VIN" value={<span className="font-mono text-xs tracking-wide text-garage-text/85">{vehicle.vin ?? 'No VIN yet'}</span>}>
                {vehicle.licensePlate ? (
                  <LicensePlate value={vehicle.licensePlate} />
                ) : onEdit ? (
                  <button type="button" onClick={onEdit} className="text-xs text-garage-muted underline decoration-dashed underline-offset-4 hover:text-garage-text">
                    Add plate
                  </button>
                ) : null}
              </GlanceRow>
              <GlanceRow label="Build" value={vehicle.bodyStyle ?? vehicle.trim ?? '—'}>
                {[
                  vehicle.seatingCapacity ? `${vehicle.seatingCapacity} seats` : null,
                  vehicle.fuelType,
                  vehicle.color,
                ]
                  .filter((pill): pill is string => Boolean(pill))
                  .map((pill) => (
                    <Pill key={pill}>{pill}</Pill>
                  ))}
              </GlanceRow>
              {vehicle.purchaseDate || vehicle.titleStatus ? (
                <GlanceRow
                  label={vehicle.purchaseDate ? 'Owned since' : 'Title'}
                  value={
                    vehicle.purchaseDate
                      ? new Date(vehicle.purchaseDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                      : (vehicle.titleStatus ?? '')
                  }
                >
                  {vehicle.purchaseDate && vehicle.titleStatus ? <Pill>{vehicle.titleStatus} title</Pill> : null}
                </GlanceRow>
              ) : null}
            </div>
          </section>
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

function ActionTile({
  icon,
  title,
  hint,
  primary,
  onClick,
  to,
}: {
  icon: ReactNode
  title: string
  hint: string
  primary?: boolean
  onClick?: () => void
  to?: { vehicleId: string; tab: 'project' }
}) {
  const className = `flex min-h-24 flex-col justify-between gap-3 rounded-sm p-3.5 text-left transition ${
    primary
      ? 'bg-garage-text text-garage-bg hover:bg-white'
      : 'bg-garage-panel-2 text-garage-text hover:bg-white/10'
  }`
  const body = (
    <>
      {icon}
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className={`mt-0.5 block truncate text-xs ${primary ? 'text-garage-bg/60' : 'text-garage-muted'}`}>{hint}</span>
      </span>
    </>
  )
  if (to) {
    return (
      <Link to="/vehicles/$vehicleId" params={{ vehicleId: to.vehicleId }} search={{ tab: to.tab }} className={className}>
        {body}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  )
}

function GlanceRow({ label, value, children }: { label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-sm bg-garage-panel-2 px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[11px] text-garage-muted">{label}</p>
        <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
      </div>
      {children ? <div className="flex shrink-0 flex-wrap justify-end gap-1.5">{children}</div> : null}
    </div>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-sm border border-garage-border bg-garage-bg px-2 py-0.5 text-[11px] text-garage-text/85">
      {children}
    </span>
  )
}

/** The plate drawn as a small plate: the detail that makes the page feel like your car. */
function LicensePlate({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-[5px] border-2 border-[#cfd3da] bg-[#f4f4f2] px-2.5 py-0.5 font-mono text-[15px] font-medium tracking-[0.08em] text-[#1b2a4a] uppercase">
      {value}
    </span>
  )
}
