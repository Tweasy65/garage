import { Link, useRouter } from '@tanstack/react-router'
import { CheckCircle2, Plus, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import Drawer from '@/components/garage/Drawer'
import { useGarageAlerts } from '@/components/garage/garageAlertsContext'
import PageShell from '@/components/garage/PageShell'
import VehicleForm from '@/components/garage/VehicleForm'
import VehicleModelCanvas from '@/components/garage/VehicleModelCanvas'
import VehiclePreview from '@/components/garage/VehiclePreview'
import VehicleThumb from '@/components/garage/VehicleThumb'
import { FEATURED_MODEL, paintColorFromName } from '@/data/vehicleModels'
import {
  filterVehicles,
  uniqueVehicleTags,
  type CollectionFilters,
} from '@/lib/collectionFilters'
import { formatMiles } from '@/lib/format'
import {
  actionableAlerts,
  type MaintenanceAlert,
} from '@/lib/maintenanceAlerts'
import type { VehicleDetail, VehicleInput, VehicleSummary } from '@/lib/vehicleTypes'
import { createVehicle, getVehicle, setVehicleFavorite } from '@/server/vehicles'

type CollectionPageProps = {
  vehicles: VehicleSummary[]
  alerts: MaintenanceAlert[]
  filters: CollectionFilters
  onFiltersChange: (filters: CollectionFilters) => void
  addOpen: boolean
  onOpenAdd: () => void
  onCloseAdd: () => void
}

export default function CollectionPage({
  vehicles,
  alerts,
  filters,
  onFiltersChange,
  addOpen,
  onOpenAdd,
  onCloseAdd,
}: CollectionPageProps) {
  const router = useRouter()
  const { refreshAlerts } = useGarageAlerts()
  const visible = useMemo(
    () => filterVehicles(vehicles, filters),
    [vehicles, filters],
  )
  const tags = useMemo(() => uniqueVehicleTags(vehicles), [vehicles])
  const [selectedId, setSelectedId] = useState<string | null>(
    visible[0]?.id ?? vehicles[0]?.id ?? null,
  )
  const [details, setDetails] = useState<Record<string, VehicleDetail | 'failed'>>({})

  useEffect(() => {
    if (selectedId && visible.some((vehicle) => vehicle.id === selectedId)) return
    setSelectedId(visible[0]?.id ?? null)
  }, [selectedId, visible])

  useEffect(() => {
    if (!selectedId || details[selectedId]) return
    const id = selectedId
    void getVehicle({ data: { id } })
      .then(({ vehicle }) => {
        setDetails((prev) => ({ ...prev, [id]: vehicle }))
      })
      .catch(() => {
        setDetails((prev) => ({ ...prev, [id]: 'failed' }))
      })
  }, [selectedId, details])

  async function toggleFavorite(vehicle: VehicleSummary) {
    await setVehicleFavorite({
      data: { id: vehicle.id, isFavorite: !vehicle.isFavorite },
    })
    await router.invalidate()
  }

  async function handleCreate(values: VehicleInput) {
    const { vehicle } = await createVehicle({ data: values })
    await router.invalidate()
    await refreshAlerts()
    await router.navigate({
      to: '/vehicles/$vehicleId',
      params: { vehicleId: vehicle.id },
    })
  }

  if (vehicles.length === 0) {
    return (
      <PageShell>
        <EmptyGarage onAdd={onOpenAdd} />
        <AddVehicleModal
          open={addOpen}
          onClose={onCloseAdd}
          onSubmit={handleCreate}
        />
      </PageShell>
    )
  }

  const selectedSummary =
    visible.find((vehicle) => vehicle.id === selectedId) ?? visible[0] ?? null
  const selectedDetail = selectedSummary ? details[selectedSummary.id] : undefined
  const previewVehicle =
    selectedDetail && selectedDetail !== 'failed' ? selectedDetail : selectedSummary
  const previewPending = selectedSummary != null && selectedDetail == null
  const filtering =
    Boolean(filters.query.trim()) ||
    filters.favorite ||
    filters.project ||
    Boolean(filters.tag)

  return (
    <PageShell>
      <ServiceSummary alerts={alerts} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <section className="garage-panel order-2 flex flex-col overflow-hidden lg:order-1 lg:max-h-[calc(100vh-8rem)]">
          <div className="flex items-center justify-between border-b border-garage-border p-4">
            <div>
              <p className="label-caps">Inventory</p>
              <h2 className="mt-1 font-semibold">
                {filtering
                  ? `${visible.length} of ${vehicles.length}`
                  : `${vehicles.length} vehicle${vehicles.length === 1 ? '' : 's'}`}
              </h2>
            </div>
            <button type="button" onClick={onOpenAdd} className="btn">
              <Plus className="size-4" />
              Add vehicle
            </button>
          </div>
          <div className="space-y-3 border-b border-garage-border p-4">
            <label className="block">
              <span className="sr-only">Search collection</span>
              <input
                className="field"
                value={filters.query}
                onChange={(event) =>
                  onFiltersChange({ ...filters, query: event.target.value })
                }
                placeholder="Search year, make, model, tag…"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="Favorites"
                active={filters.favorite}
                onClick={() =>
                  onFiltersChange({ ...filters, favorite: !filters.favorite })
                }
              />
              <FilterChip
                label="Projects"
                active={filters.project}
                onClick={() =>
                  onFiltersChange({ ...filters, project: !filters.project })
                }
              />
              {tags.map((tag) => (
                <FilterChip
                  key={tag}
                  label={tag}
                  active={filters.tag === tag}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      tag: filters.tag === tag ? undefined : tag,
                    })
                  }
                />
              ))}
            </div>
          </div>
          {visible.length === 0 ? (
            <p className="p-4 text-sm text-garage-muted">
              No vehicles match this search.
            </p>
          ) : (
            <ul className="divide-y divide-garage-border overflow-y-auto">
              {visible.map((vehicle) => {
                const active = vehicle.id === selectedSummary?.id
                return (
                  <li key={vehicle.id}>
                    <div
                      className={`flex items-center gap-3 border-l-2 p-3 transition ${
                        active
                          ? 'border-garage-accent bg-white/5'
                          : 'border-transparent hover:bg-white/5'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(vehicle.id)}
                        aria-pressed={active}
                        aria-label={`Preview ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="shrink-0"
                      >
                        <VehicleThumb
                          src={vehicle.imageUrl}
                          alt=""
                          className="size-14 rounded-sm"
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/vehicles/$vehicleId"
                          params={{ vehicleId: vehicle.id }}
                          className="block truncate font-medium hover:text-white"
                        >
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSelectedId(vehicle.id)}
                          className="block w-full truncate text-left text-sm text-garage-muted"
                        >
                          {formatMiles(vehicle.mileage)}
                          {vehicle.color ? ` · ${vehicle.color}` : ''}
                          {vehicle.isProject ? ' · Project' : ''}
                        </button>
                      </div>
                      <Link
                        to="/vehicles/$vehicleId"
                        params={{ vehicleId: vehicle.id }}
                        className="btn hidden shrink-0 px-2 text-xs sm:inline-flex"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        className="shrink-0 rounded-sm p-2 text-garage-muted hover:bg-white/10 hover:text-garage-text"
                        aria-label={
                          vehicle.isFavorite
                            ? `Remove ${vehicle.make} ${vehicle.model} from favorites`
                            : `Favorite ${vehicle.make} ${vehicle.model}`
                        }
                        aria-pressed={vehicle.isFavorite}
                        onClick={() => void toggleFavorite(vehicle)}
                      >
                        <Star
                          className={`size-4 ${
                            vehicle.isFavorite
                              ? 'fill-garage-accent text-garage-accent'
                              : ''
                          }`}
                        />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <VehiclePreview
          vehicle={previewVehicle}
          pending={previewPending}
          className="order-1 lg:sticky lg:top-4 lg:order-2"
        />
      </div>
      <AddVehicleModal
        open={addOpen}
        onClose={onCloseAdd}
        onSubmit={handleCreate}
      />
    </PageShell>
  )
}

function EmptyGarage({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="garage-panel overflow-hidden">
        <VehicleModelCanvas
          spec={FEATURED_MODEL}
          color={paintColorFromName('red')}
          className="h-72 w-full md:h-80"
        />
      </div>
      <div className="garage-panel px-8 py-12 text-center">
        <p className="label-caps">Collection</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Your garage is empty
        </h1>
        <p className="mt-3 text-sm text-garage-muted">
          Add a vehicle to start tracking mileage, photos, and service history.
        </p>
        <button type="button" onClick={onAdd} className="btn-primary mt-8">
          <Plus className="size-4" />
          Add vehicle
        </button>
      </div>
    </div>
  )
}

function AddVehicleModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: VehicleInput) => Promise<void>
}) {
  return (
    <Drawer open={open} onClose={onClose} hint="New vehicle" title="Add to garage">
      <VehicleForm
        open={open}
        entityId={open ? 'new-vehicle' : 'closed'}
        submitLabel="Add vehicle"
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Drawer>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`badge ${active ? 'border-garage-accent text-garage-text' : ''}`}
    >
      {label}
    </button>
  )
}

function ServiceSummary({ alerts }: { alerts: MaintenanceAlert[] }) {
  const due = actionableAlerts(alerts)
  const overdue = due.filter((alert) => alert.severity === 'overdue').length
  const dueSoon = due.filter((alert) => alert.severity === 'due-soon').length
  const summary =
    overdue || dueSoon
      ? [overdue ? `${overdue} overdue` : null, dueSoon ? `${dueSoon} due soon` : null]
          .filter(Boolean)
          .join(' · ')
      : 'Service is current'

  return (
    <Link
      to="/service"
      className="garage-panel flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-white/5"
    >
      <div className="flex items-center gap-3">
        {overdue || dueSoon ? (
          <span className="text-sm font-medium">Service</span>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="size-4 text-emerald-400" />
            Service
          </span>
        )}
        <span className="text-sm text-garage-muted">{summary}</span>
      </div>
      <span className="text-xs text-garage-muted">View all</span>
    </Link>
  )
}
