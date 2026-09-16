import { Show, SignInButton } from '@clerk/tanstack-react-start'
import { useRouter } from '@tanstack/react-router'
import { Plus, Star, Trash2, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'

import AlertsPanel from '@/components/garage/AlertsPanel'
import CollectionCarousel from '@/components/garage/CollectionCarousel'
import MaintenanceForm from '@/components/garage/MaintenanceForm'
import VehicleForm from '@/components/garage/VehicleForm'
import type { MaintenanceAlert } from '@/lib/maintenanceAlerts'
import type {
  VehicleDetail,
  VehicleInput,
  VehicleSummary,
} from '@/lib/vehicleTypes'
import { addMaintenanceRecord, deleteMaintenanceRecord } from '@/server/maintenance'
import {
  createVehicle,
  deleteVehicle,
  getVehicle,
  listVehicles,
  updateVehicle,
} from '@/server/vehicles'

type GarageAppProps = {
  initialVehicles: VehicleSummary[]
  initialAlerts: MaintenanceAlert[]
}

type Panel = 'list' | 'add' | 'edit'

export default function GarageApp({
  initialVehicles,
  initialAlerts,
}: GarageAppProps) {
  const router = useRouter()
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [alerts, setAlerts] = useState(initialAlerts)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialVehicles[0]?.id ?? null,
  )
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDetail | null>(
    null,
  )
  const [panel, setPanel] = useState<Panel>('list')
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance'>(
    'overview',
  )

  useEffect(() => {
    if (selectedId && !selectedVehicle) {
      void loadVehicle(selectedId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  async function refreshList(selectId?: string | null) {
    const { vehicles: next, alerts: nextAlerts } = await listVehicles()
    setVehicles(next)
    setAlerts(nextAlerts)
    const id = selectId ?? selectedId
    if (id && next.some((vehicle) => vehicle.id === id)) {
      await loadVehicle(id)
    } else if (next[0]) {
      await loadVehicle(next[0].id)
    } else {
      setSelectedId(null)
      setSelectedVehicle(null)
    }
    await router.invalidate()
  }

  async function loadVehicle(id: string) {
    setLoadingDetail(true)
    try {
      const { vehicle } = await getVehicle({ data: { id } })
      setSelectedId(id)
      setSelectedVehicle(vehicle)
      setPanel('list')
      setActiveTab('overview')
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleCreate(values: VehicleInput) {
    const { vehicle } = await createVehicle({ data: values })
    await refreshList(vehicle.id)
  }

  async function handleUpdate(values: VehicleInput) {
    if (!selectedVehicle) return
    const { vehicle } = await updateVehicle({
      data: { ...values, id: selectedVehicle.id },
    })
    setSelectedVehicle(vehicle)
    await refreshList(vehicle.id)
  }

  async function handleDelete() {
    if (!selectedVehicle) return
    if (!window.confirm('Delete this vehicle and all maintenance records?')) {
      return
    }
    await deleteVehicle({ data: { id: selectedVehicle.id } })
    setSelectedVehicle(null)
    setSelectedId(null)
    await refreshList(null)
  }

  return (
    <>
      <Show when="signed-in">
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-6">
          <CollectionCarousel
            vehicles={vehicles}
            selectedId={selectedId}
            onSelect={(id) => void loadVehicle(id)}
          />
          <AlertsPanel
            alerts={alerts}
            onSelect={(id) => void loadVehicle(id)}
          />

          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <aside className="garage-panel flex max-h-[calc(100dvh-8rem)] flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-garage-border p-4">
                <div>
                  <p className="label-caps">Inventory</p>
                  <h2 className="mt-1 font-semibold">
                    {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPanel('add')}
                  className="btn px-2"
                  aria-label="Add vehicle"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {vehicles.length === 0 ? (
                  <p className="p-4 text-sm text-garage-muted">
                    No vehicles yet. Add one to start tracking service.
                  </p>
                ) : (
                  vehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => loadVehicle(vehicle.id)}
                      className={`flex w-full items-center gap-3 border-b border-garage-border p-3 text-left ${
                        selectedId === vehicle.id
                          ? 'bg-white/10'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="size-12 shrink-0 overflow-hidden rounded-sm bg-garage-panel-2">
                        {vehicle.imageUrl ? (
                          <img
                            src={vehicle.imageUrl}
                            alt=""
                            className="size-full object-cover grayscale"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          {vehicle.isFavorite ? (
                            <Star className="size-3 fill-garage-accent text-garage-accent" />
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-garage-muted">
                          {vehicle.mileage.toLocaleString()} mi
                          {vehicle.isProject ? ' · Project' : ''}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <section>
              {panel === 'add' ? (
                <div className="garage-panel p-6">
                  <p className="label-caps">New vehicle</p>
                  <h2 className="mb-4 mt-1 text-xl font-semibold">Add to garage</h2>
                  <VehicleForm
                    submitLabel="Add vehicle"
                    onSubmit={handleCreate}
                    onCancel={() => setPanel('list')}
                  />
                </div>
              ) : panel === 'edit' && selectedVehicle ? (
                <div className="garage-panel p-6">
                  <p className="label-caps">Edit</p>
                  <h2 className="mb-4 mt-1 text-xl font-semibold">Vehicle details</h2>
                  <VehicleForm
                    submitLabel="Save changes"
                    initial={{
                      make: selectedVehicle.make,
                      model: selectedVehicle.model,
                      trim: selectedVehicle.trim,
                      year: selectedVehicle.year,
                      color: selectedVehicle.color,
                      mileage: selectedVehicle.mileage,
                      vin: selectedVehicle.vin,
                      licensePlate: selectedVehicle.licensePlate,
                      purchaseDate: selectedVehicle.purchaseDate?.slice(0, 10),
                      notes: selectedVehicle.notes,
                      isProject: selectedVehicle.isProject,
                      isFavorite: selectedVehicle.isFavorite,
                      bodyStyle: selectedVehicle.bodyStyle,
                      transmission: selectedVehicle.transmission,
                      fuelType: selectedVehicle.fuelType,
                      drivetrain: selectedVehicle.drivetrain,
                      titleStatus: selectedVehicle.titleStatus,
                      imageUrl: selectedVehicle.imageUrl,
                      tags: selectedVehicle.tags,
                    }}
                    onSubmit={handleUpdate}
                    onCancel={() => setPanel('list')}
                  />
                </div>
              ) : selectedVehicle ? (
                <div className="space-y-4">
                  <div className="garage-panel overflow-hidden">
                    <div className="grid md:grid-cols-[1.1fr_1fr]">
                      <div className="min-h-56 bg-garage-panel-2">
                        {selectedVehicle.imageUrl ? (
                          <img
                            src={selectedVehicle.imageUrl}
                            alt=""
                            className="h-full w-full object-cover grayscale"
                          />
                        ) : (
                          <div className="flex h-full min-h-56 items-center justify-center text-garage-muted">
                            No photo
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-between p-6">
                        <div>
                          <p className="label-caps">
                            {selectedVehicle.bodyStyle || 'Vehicle'}
                          </p>
                          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                            {selectedVehicle.year} {selectedVehicle.make}{' '}
                            {selectedVehicle.model}
                          </h1>
                          {selectedVehicle.trim ? (
                            <p className="mt-1 text-garage-muted">
                              {selectedVehicle.trim}
                            </p>
                          ) : null}
                        </div>
                        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                          <Stat
                            label="Odometer"
                            value={`${selectedVehicle.mileage.toLocaleString()} mi`}
                          />
                          <Stat
                            label="Records"
                            value={String(selectedVehicle.maintenanceCount)}
                          />
                          <Stat
                            label="Color"
                            value={selectedVehicle.color ?? '—'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="garage-panel">
                    <div className="flex border-b border-garage-border">
                      <TabButton
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                      >
                        Overview
                      </TabButton>
                      <TabButton
                        active={activeTab === 'maintenance'}
                        onClick={() => setActiveTab('maintenance')}
                      >
                        Maintenance
                      </TabButton>
                    </div>

                    {loadingDetail ? (
                      <div className="p-6 text-garage-muted">Loading…</div>
                    ) : activeTab === 'overview' ? (
                      <div className="space-y-6 p-6">
                        <DetailGrid vehicle={selectedVehicle} />
                        {selectedVehicle.notes ? (
                          <div>
                            <p className="label-caps mb-2">Notes</p>
                            <p className="text-sm leading-relaxed text-garage-muted">
                              {selectedVehicle.notes}
                            </p>
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => setPanel('edit')}
                            className="btn"
                          >
                            Edit vehicle
                          </button>
                          <button
                            type="button"
                            onClick={handleDelete}
                            className="btn text-red-300"
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 p-6">
                        <MaintenanceForm
                          vehicleId={selectedVehicle.id}
                          onSubmit={async (values) => {
                            await addMaintenanceRecord({ data: values })
                            await loadVehicle(selectedVehicle.id)
                            await refreshList(selectedVehicle.id)
                          }}
                        />
                        <div className="space-y-2">
                          {selectedVehicle.maintenance.length === 0 ? (
                            <p className="text-sm text-garage-muted">
                              No maintenance records yet.
                            </p>
                          ) : (
                            selectedVehicle.maintenance.map((record) => (
                              <div
                                key={record.id}
                                className="flex items-start justify-between gap-4 border border-garage-border p-4"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Wrench className="size-4 text-garage-muted" />
                                    <p className="font-medium">{record.type}</p>
                                  </div>
                                  <p className="mt-1 text-sm text-garage-muted">
                                    {new Date(record.date).toLocaleDateString()}
                                    {record.mileage
                                      ? ` · ${record.mileage.toLocaleString()} mi`
                                      : ''}
                                    {record.costCents
                                      ? ` · $${(record.costCents / 100).toFixed(2)}`
                                      : ''}
                                  </p>
                                  {record.description ? (
                                    <p className="mt-2 text-sm text-garage-muted">
                                      {record.description}
                                    </p>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await deleteMaintenanceRecord({
                                      data: { id: record.id },
                                    })
                                    await loadVehicle(selectedVehicle.id)
                                    await refreshList(selectedVehicle.id)
                                  }}
                                  className="text-sm text-garage-muted hover:text-red-300"
                                >
                                  Remove
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="garage-panel flex h-full min-h-80 items-center justify-center p-8 text-center text-garage-muted">
                  Select a vehicle or add one to get started.
                </div>
              )}
            </section>
          </div>
        </div>
      </Show>
      <Show when="signed-out">
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <p className="label-caps">Barton Home</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Garage</h1>
          <p className="mt-4 text-garage-muted">
            Vehicle inventory, service history, and maintenance alerts.
          </p>
          <SignInButton mode="modal">
            <button type="button" className="btn-primary mt-8">
              Sign in
            </button>
          </SignInButton>
        </div>
      </Show>
    </>
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-5 py-3 text-sm ${
        active
          ? 'border-garage-accent text-garage-text'
          : 'border-transparent text-garage-muted hover:text-garage-text'
      }`}
    >
      {children}
    </button>
  )
}

function DetailGrid({ vehicle }: { vehicle: VehicleDetail }) {
  const items = [
    ['VIN', vehicle.vin],
    ['License plate', vehicle.licensePlate],
    ['Body style', vehicle.bodyStyle],
    ['Transmission', vehicle.transmission],
    ['Fuel type', vehicle.fuelType],
    ['Drivetrain', vehicle.drivetrain],
    ['Engine', vehicle.engineType],
    ['Purchase date', vehicle.purchaseDate?.slice(0, 10)],
    ['Title status', vehicle.titleStatus],
  ].filter(([, value]) => value)

  if (items.length === 0) {
    return (
      <p className="text-sm text-garage-muted">
        Add more details by editing this vehicle.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label}>
          <p className="label-caps">{label}</p>
          <p className="mt-1 font-medium">{value}</p>
        </div>
      ))}
    </div>
  )
}
