import { Link, useRouter } from '@tanstack/react-router'
import { CheckCircle2, Plus, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

import Drawer from '@/components/garage/Drawer'
import { useGarageAlerts } from '@/components/garage/garageAlertsContext'
import PageShell from '@/components/garage/PageShell'
import VehicleForm from '@/components/garage/VehicleForm'
import VehicleModelCanvas from '@/components/garage/VehicleModelCanvas'
import VehiclePreview from '@/components/garage/VehiclePreview'
import VehicleThumb from '@/components/garage/VehicleThumb'
import { FEATURED_MODEL, paintColorFromName } from '@/data/vehicleModels'
import { formatMiles } from '@/lib/format'
import type { MaintenanceAlert } from '@/lib/maintenanceAlerts'
import type { VehicleDetail, VehicleInput, VehicleSummary } from '@/lib/vehicleTypes'
import { createVehicle, getVehicle } from '@/server/vehicles'

type CollectionPageProps = {
  vehicles: VehicleSummary[]
  alerts: MaintenanceAlert[]
  addOpen: boolean
  onOpenAdd: () => void
  onCloseAdd: () => void
}

export default function CollectionPage({
  vehicles,
  alerts,
  addOpen,
  onOpenAdd,
  onCloseAdd,
}: CollectionPageProps) {
  const router = useRouter()
  const { refreshAlerts } = useGarageAlerts()
  const [selectedId, setSelectedId] = useState<string | null>(
    vehicles[0]?.id ?? null,
  )
  const [details, setDetails] = useState<Record<string, VehicleDetail | 'failed'>>({})

  useEffect(() => {
    if (selectedId && vehicles.some((vehicle) => vehicle.id === selectedId)) return
    setSelectedId(vehicles[0]?.id ?? null)
  }, [selectedId, vehicles])

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
    vehicles.find((vehicle) => vehicle.id === selectedId) ?? vehicles[0] ?? null
  const selectedDetail = selectedSummary ? details[selectedSummary.id] : undefined
  const previewVehicle =
    selectedDetail && selectedDetail !== 'failed' ? selectedDetail : selectedSummary
  const previewPending = selectedSummary != null && selectedDetail == null

  return (
    <PageShell>
      <ServiceSummary alerts={alerts} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <section className="garage-panel order-2 flex flex-col overflow-hidden lg:order-1 lg:max-h-[calc(100vh-8rem)]">
          <div className="flex items-center justify-between border-b border-garage-border p-4">
            <div>
              <p className="label-caps">Inventory</p>
              <h2 className="mt-1 font-semibold">
                {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'}
              </h2>
            </div>
            <button type="button" onClick={onOpenAdd} className="btn">
              <Plus className="size-4" />
              Add vehicle
            </button>
          </div>
          <ul className="divide-y divide-garage-border overflow-y-auto">
            {vehicles.map((vehicle) => {
              const active = vehicle.id === selectedSummary?.id
              return (
                <li key={vehicle.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(vehicle.id)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-3 border-l-2 p-3 text-left transition ${
                      active
                        ? 'border-garage-accent bg-white/5'
                        : 'border-transparent hover:bg-white/5'
                    }`}
                  >
                    <VehicleThumb
                      src={vehicle.imageUrl}
                      alt=""
                      className="size-14 shrink-0 rounded-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        {vehicle.isFavorite ? (
                          <Star className="size-3 shrink-0 fill-garage-accent text-garage-accent" />
                        ) : null}
                      </div>
                      <p className="truncate text-sm text-garage-muted">
                        {formatMiles(vehicle.mileage)}
                        {vehicle.color ? ` · ${vehicle.color}` : ''}
                        {vehicle.isProject ? ' · Project' : ''}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
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

function ServiceSummary({ alerts }: { alerts: MaintenanceAlert[] }) {
  const overdue = alerts.filter((alert) => alert.severity === 'overdue').length
  const dueSoon = alerts.filter((alert) => alert.severity === 'due-soon').length
  const summary =
    overdue || dueSoon
      ? [overdue ? `${overdue} overdue` : null, dueSoon ? `${dueSoon} due soon` : null]
          .filter(Boolean)
          .join(' · ')
      : alerts.length
        ? `${alerts.length} items to review`
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
