import { Show, SignInButton } from '@clerk/tanstack-react-start'
import { useRouter } from '@tanstack/react-router'
import {
  ChevronRight,
  Plus,
  Star,
  Trash2,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'

import MaintenanceForm from '@/components/garage/MaintenanceForm'
import VehicleForm from '@/components/garage/VehicleForm'
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
}

type Panel = 'list' | 'add' | 'edit'

export default function GarageApp({ initialVehicles }: GarageAppProps) {
  const router = useRouter()
  const [vehicles, setVehicles] = useState(initialVehicles)
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

  async function refreshList(selectId?: string | null) {
    const { vehicles: next } = await listVehicles()
    setVehicles(next)
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

  async function handleCreate(values: Parameters<typeof createVehicle>[0]['data']) {
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
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-[320px_1fr] md:px-6">
          <aside className="garage-panel flex max-h-[calc(100dvh-8rem)] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-garage-border p-4">
              <div>
                <h2 className="font-semibold">My collection</h2>
                <p className="text-sm text-garage-muted">
                  {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPanel('add')}
                className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
                aria-label="Add vehicle"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {vehicles.length === 0 ? (
                <div className="p-4 text-sm text-garage-muted">
                  No vehicles yet. Add your first one to start tracking
                  maintenance and details.
                </div>
              ) : (
                vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => loadVehicle(vehicle.id)}
                    className={`mb-2 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                      selectedId === vehicle.id
                        ? 'bg-white/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-garage-panel-2">
                      {vehicle.imageUrl ? (
                        <img
                          src={vehicle.imageUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xs text-garage-muted">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        {vehicle.isFavorite ? (
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        ) : null}
                      </div>
                      <p className="truncate text-sm text-garage-muted">
                        {vehicle.mileage.toLocaleString()} mi
                        {vehicle.isProject ? ' · Project' : ''}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-garage-muted" />
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="min-h-[calc(100dvh-8rem)]">
            {panel === 'add' ? (
              <div className="garage-panel p-6">
                <h2 className="mb-4 text-xl font-semibold">Add vehicle</h2>
                <VehicleForm
                  submitLabel="Add vehicle"
                  onSubmit={handleCreate}
                  onCancel={() => setPanel('list')}
                />
              </div>
            ) : panel === 'edit' && selectedVehicle ? (
              <div className="garage-panel p-6">
                <h2 className="mb-4 text-xl font-semibold">Edit vehicle</h2>
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
                  <div className="grid md:grid-cols-[1.2fr_1fr]">
                    <div className="min-h-64 bg-garage-panel-2">
                      {selectedVehicle.imageUrl ? (
                        <img
                          src={selectedVehicle.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-64 items-center justify-center text-garage-muted">
                          No photo yet
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-between p-6">
                      <div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          {selectedVehicle.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-white/10 px-3 py-1 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h1 className="text-3xl font-semibold">
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
                  <div className="flex gap-2 border-b border-garage-border p-2">
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
                          <h3 className="mb-2 font-medium">Notes</h3>
                          <p className="text-sm leading-relaxed text-garage-muted">
                            {selectedVehicle.notes}
                          </p>
                        </div>
                      ) : null}
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setPanel('edit')}
                          className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                        >
                          Edit vehicle
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="inline-flex items-center gap-2 rounded-full border border-red-500/30 px-4 py-2 text-sm text-red-300"
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
                      <div className="space-y-3">
                        {selectedVehicle.maintenance.length === 0 ? (
                          <p className="text-sm text-garage-muted">
                            No maintenance records yet.
                          </p>
                        ) : (
                          selectedVehicle.maintenance.map((record) => (
                            <div
                              key={record.id}
                              className="garage-panel flex items-start justify-between gap-4 p-4"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <Wrench className="size-4 text-garage-accent" />
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
                                className="text-sm text-red-300"
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
      </Show>
      <Show when="signed-out">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="mb-4 text-4xl font-semibold">Your virtual garage</h1>
          <p className="mb-8 text-garage-muted">
            Track vehicles, maintenance, and service history in one place.
          </p>
          <SignInButton mode="modal">
            <button
              type="button"
              className="rounded-full bg-garage-accent px-6 py-3 font-semibold text-black"
            >
              Sign in to open your garage
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
      <p className="text-garage-muted">{label}</p>
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
      className={`rounded-xl px-4 py-2 text-sm ${
        active ? 'bg-white/10 text-white' : 'text-garage-muted hover:text-white'
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
          <p className="text-sm text-garage-muted">{label}</p>
          <p className="mt-1 font-medium">{value}</p>
        </div>
      ))}
    </div>
  )
}
