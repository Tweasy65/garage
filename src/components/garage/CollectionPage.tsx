import { Link, useRouter } from '@tanstack/react-router'
import { CheckCircle2, Plus, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

import CollectionCarousel from '@/components/garage/CollectionCarousel'
import Modal from '@/components/garage/Modal'
import PageShell from '@/components/garage/PageShell'
import VehicleForm from '@/components/garage/VehicleForm'
import VehicleModelCanvas from '@/components/garage/VehicleModelCanvas'
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
  const [selectedId, setSelectedId] = useState<string | null>(
    vehicles[0]?.id ?? null,
  )
  const [selectedDetail, setSelectedDetail] = useState<VehicleDetail | null>(null)

  useEffect(() => {
    if (selectedId && vehicles.some((vehicle) => vehicle.id === selectedId)) return
    setSelectedId(vehicles[0]?.id ?? null)
  }, [selectedId, vehicles])

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null)
      return
    }
    let cancelled = false
    void getVehicle({ data: { id: selectedId } })
      .then(({ vehicle }) => {
        if (!cancelled) setSelectedDetail(vehicle)
      })
      .catch(() => {
        if (!cancelled) setSelectedDetail(null)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  async function handleCreate(values: VehicleInput) {
    const { vehicle } = await createVehicle({ data: values })
    await router.invalidate()
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

  return (
    <PageShell>
      <CollectionCarousel
        vehicles={vehicles}
        selectedId={selectedId}
        selectedDetail={selectedDetail}
        onSelect={setSelectedId}
      />
      <ServiceSummary alerts={alerts} />
      <section className="garage-panel">
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
        <div className="grid gap-px bg-garage-border sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link
              key={vehicle.id}
              to="/vehicles/$vehicleId"
              params={{ vehicleId: vehicle.id }}
              className="flex items-center gap-3 bg-garage-panel p-4 transition hover:bg-white/5"
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
                    <Star className="size-3 fill-garage-accent text-garage-accent" />
                  ) : null}
                </div>
                <p className="truncate text-sm text-garage-muted">
                  {formatMiles(vehicle.mileage)}
                  {vehicle.isProject ? ' · Project' : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
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
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      hint="New vehicle"
      title="Add to garage"
    >
      <VehicleForm
        submitLabel="Add vehicle"
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
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
