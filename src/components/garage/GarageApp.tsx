import { Show, SignInButton } from '@clerk/tanstack-react-start'
import { useRouter } from '@tanstack/react-router'
import { Plus, Star, Trash2, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'

import AlertsPanel from '@/components/garage/AlertsPanel'
import CollectionCarousel from '@/components/garage/CollectionCarousel'
import MaintenanceForm from '@/components/garage/MaintenanceForm'
import VehicleForm from '@/components/garage/VehicleForm'
import VehicleModelCanvas from '@/components/garage/VehicleModelCanvas'
import VehicleThumb from '@/components/garage/VehicleThumb'
import {
  FEATURED_MODEL,
  modelForVehicle,
  paintColorFromName,
} from '@/data/vehicleModels'
import { formatDate, formatMiles, formatMoney } from '@/lib/format'
import type { MaintenanceAlert } from '@/lib/maintenanceAlerts'
import type {
  MaintenanceInput,
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
type Tab = 'overview' | 'maintenance'

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
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedId && !selectedVehicle) {
      void loadVehicle(selectedId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  async function refreshList(selectId?: string | null, tab?: Tab) {
    const { vehicles: next, alerts: nextAlerts } = await listVehicles()
    setVehicles(next)
    setAlerts(nextAlerts)
    const id = selectId ?? selectedId
    if (id && next.some((vehicle) => vehicle.id === id)) {
      await loadVehicle(id, tab)
    } else if (next[0]) {
      await loadVehicle(next[0].id)
    } else {
      setSelectedId(null)
      setSelectedVehicle(null)
    }
    await router.invalidate()
  }

  async function loadVehicle(id: string, tab?: Tab) {
    const sameVehicle = selectedId === id
    setLoadingDetail(true)
    setActionError(null)
    try {
      const { vehicle } = await getVehicle({ data: { id } })
      setSelectedId(id)
      setSelectedVehicle(vehicle)
      setPanel('list')
      if (tab) setActiveTab(tab)
      else if (!sameVehicle) setActiveTab('overview')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not load vehicle')
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
    try {
      await deleteVehicle({ data: { id: selectedVehicle.id } })
      setSelectedVehicle(null)
      setSelectedId(null)
      await refreshList(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete vehicle')
    }
  }

  return (
    <>
      <Show when="signed-in">
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-6">
          {vehicles.length === 0 && panel !== 'add' ? (
            <EmptyGarage onAdd={() => setPanel('add')} />
          ) : vehicles.length === 0 && panel === 'add' ? (
            <div className="garage-panel mx-auto max-w-3xl p-6">
              <p className="label-caps">New vehicle</p>
              <h2 className="mb-4 mt-1 text-xl font-semibold">Add to garage</h2>
              <VehicleForm
                submitLabel="Add vehicle"
                onSubmit={handleCreate}
                onCancel={() => setPanel('list')}
              />
            </div>
          ) : (
            <>
              <CollectionCarousel
                vehicles={vehicles}
                selectedId={selectedId}
                onSelect={(id) => void loadVehicle(id)}
              />
              {vehicles.length > 0 ? (
                <AlertsPanel
                  alerts={alerts}
                  onSelect={(id) => void loadVehicle(id, 'maintenance')}
                />
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                <aside className="garage-panel flex max-h-[calc(100dvh-8rem)] flex-col overflow-hidden lg:sticky lg:top-20">
                  <div className="flex items-center justify-between border-b border-garage-border p-4">
                    <div>
                      <p className="label-caps">Inventory</p>
                      <h2 className="mt-1 font-semibold">
                        {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPanel('add')
                        setActionError(null)
                      }}
                      className={`btn px-2 ${panel === 'add' ? 'border-garage-accent bg-white/10' : ''}`}
                      aria-label="Add vehicle"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {vehicles.length === 0 ? (
                      <p className="p-4 text-sm text-garage-muted">
                        No vehicles yet.
                      </p>
                    ) : (
                      vehicles.map((vehicle) => (
                        <button
                          key={vehicle.id}
                          type="button"
                          onClick={() => void loadVehicle(vehicle.id)}
                          className={`flex w-full items-center gap-3 border-b border-garage-border p-3 text-left transition ${
                            selectedId === vehicle.id && panel !== 'add'
                              ? 'bg-white/10'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <VehicleThumb
                            src={vehicle.imageUrl}
                            alt=""
                            className="size-12 shrink-0 rounded-sm"
                          />
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
                              {formatMiles(vehicle.mileage)}
                              {vehicle.isProject ? ' · Project' : ''}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </aside>

                <section>
                  {actionError ? (
                    <p className="mb-4 rounded-sm border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                      {actionError}
                    </p>
                  ) : null}
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
                      <h2 className="mb-4 mt-1 text-xl font-semibold">
                        {selectedVehicle.year} {selectedVehicle.make}{' '}
                        {selectedVehicle.model}
                      </h2>
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
                          engineType: selectedVehicle.engineType,
                          titleStatus: selectedVehicle.titleStatus,
                          imageUrl: selectedVehicle.imageUrl,
                          tags: selectedVehicle.tags,
                        }}
                        onSubmit={handleUpdate}
                        onCancel={() => setPanel('list')}
                      />
                    </div>
                  ) : selectedVehicle ? (
                    <VehicleDetailView
                      vehicle={selectedVehicle}
                      loading={loadingDetail}
                      activeTab={activeTab}
                      onTab={setActiveTab}
                      onEdit={() => setPanel('edit')}
                      onDelete={() => void handleDelete()}
                      onAddMaintenance={async (values) => {
                        await addMaintenanceRecord({ data: values })
                        await refreshList(selectedVehicle.id, 'maintenance')
                      }}
                      onDeleteMaintenance={async (id) => {
                        if (!window.confirm('Remove this service record?')) return
                        await deleteMaintenanceRecord({ data: { id } })
                        await refreshList(selectedVehicle.id, 'maintenance')
                      }}
                    />
                  ) : (
                    <div className="garage-panel flex h-full min-h-80 items-center justify-center p-8 text-center text-garage-muted">
                      Select a vehicle or add one to get started.
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </Show>
      <Show when="signed-out">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="label-caps">Barton Home</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Garage</h1>
          <p className="mt-4 text-garage-muted">
            Keep the collection, odometer, and service history in one place —
            with alerts when oil, tires, or inspection are due.
          </p>
          <div className="garage-panel mt-8 overflow-hidden">
            <VehicleModelCanvas
              spec={FEATURED_MODEL}
              color={paintColorFromName('red')}
              className="h-72 w-full md:h-80"
            />
          </div>
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
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Your garage is empty</h1>
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

function VehicleDetailView({
  vehicle,
  loading,
  activeTab,
  onTab,
  onEdit,
  onDelete,
  onAddMaintenance,
  onDeleteMaintenance,
}: {
  vehicle: VehicleDetail
  loading: boolean
  activeTab: Tab
  onTab: (tab: Tab) => void
  onEdit: () => void
  onDelete: () => void
  onAddMaintenance: (values: MaintenanceInput) => Promise<void>
  onDeleteMaintenance: (id: string) => Promise<void>
}) {
  const spec = modelForVehicle(vehicle)
  return (
    <div className="space-y-4">
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
              <Stat
                label="Records"
                value={String(vehicle.maintenanceCount)}
              />
              <Stat label="Color" value={vehicle.color ?? '—'} />
            </div>
          </div>
        </div>
      </div>

      <div className="garage-panel">
        <div className="flex border-b border-garage-border">
          <TabButton active={activeTab === 'overview'} onClick={() => onTab('overview')}>
            Overview
          </TabButton>
          <TabButton
            active={activeTab === 'maintenance'}
            onClick={() => onTab('maintenance')}
          >
            Maintenance
            {vehicle.maintenanceCount ? (
              <span className="ml-2 text-garage-muted">{vehicle.maintenanceCount}</span>
            ) : null}
          </TabButton>
        </div>

        {loading ? (
          <div className="p-6 text-garage-muted">Loading…</div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-6 p-6">
            <DetailGrid vehicle={vehicle} />
            {vehicle.notes ? (
              <div>
                <p className="label-caps mb-2">Notes</p>
                <p className="text-sm leading-relaxed text-garage-muted">
                  {vehicle.notes}
                </p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={onEdit} className="btn">
                Edit vehicle
              </button>
              <button type="button" onClick={onDelete} className="btn text-red-300">
                <Trash2 className="size-4" />
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-6">
            <MaintenanceForm
              vehicleId={vehicle.id}
              defaultMileage={vehicle.mileage}
              onSubmit={onAddMaintenance}
            />
            <div className="space-y-2">
              {vehicle.maintenance.length === 0 ? (
                <p className="text-sm text-garage-muted">
                  No maintenance records yet. Log an oil change to start the clock.
                </p>
              ) : (
                vehicle.maintenance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-start justify-between gap-4 border border-garage-border p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Wrench className="size-4 shrink-0 text-garage-muted" />
                        <p className="font-medium">{record.type}</p>
                      </div>
                      <p className="mt-1 text-sm text-garage-muted">
                        {formatDate(record.date)}
                        {record.mileage != null ? ` · ${formatMiles(record.mileage)}` : ''}
                        {formatMoney(record.costCents)
                          ? ` · ${formatMoney(record.costCents)}`
                          : ''}
                      </p>
                      {record.serviceProvider ? (
                        <p className="mt-1 text-sm text-garage-muted">
                          {record.serviceProvider}
                        </p>
                      ) : null}
                      {record.nextDueDate || record.nextDueMileage != null ? (
                        <p className="mt-1 text-xs text-garage-muted">
                          Next due
                          {record.nextDueDate ? ` ${formatDate(record.nextDueDate)}` : ''}
                          {record.nextDueMileage != null
                            ? ` · ${formatMiles(record.nextDueMileage)}`
                            : ''}
                        </p>
                      ) : null}
                      {record.description ? (
                        <p className="mt-2 text-sm text-garage-muted">
                          {record.description}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => void onDeleteMaintenance(record.id)}
                      className="shrink-0 text-sm text-garage-muted hover:text-red-300"
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
    ['Purchase date', formatDate(vehicle.purchaseDate)],
    ['Title status', vehicle.titleStatus],
  ].filter(([, value]) => value)

  if (items.length === 0) {
    return (
      <p className="text-sm text-garage-muted">
        Add specs, VIN, or a purchase date by editing this vehicle.
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
