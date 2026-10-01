import { Plus } from 'lucide-react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useMemo } from 'react'

import MaintenanceAlertRows from '@/components/garage/MaintenanceAlertRows'
import MaintenanceForm from '@/components/garage/MaintenanceForm'
import MaintenanceList from '@/components/garage/MaintenanceList'
import Modal from '@/components/garage/Modal'
import PageShell from '@/components/garage/PageShell'
import ServiceStats, { RECENT_DAYS, isRecent } from '@/components/garage/ServiceStats'
import { useGarageAlerts } from '@/components/garage/garageAlertsContext'
import { MAINTENANCE_TYPES } from '@/data/vehicleCatalog'
import type { MaintenanceAlert } from '@/lib/maintenanceAlerts'
import type {
  MaintenanceInput,
  ServiceRecord,
  VehicleSummary,
} from '@/lib/vehicleTypes'
import { addMaintenanceRecord, deleteMaintenanceRecord, updateMaintenanceRecord } from '@/server/maintenance'

export type ServiceFilters = {
  status?: 'all' | 'overdue' | 'due-soon' | 'missing' | 'recent' | 'history'
  vehicle?: string
  type?: string
  log?: boolean
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due-soon', label: 'Due soon' },
  { value: 'missing', label: 'Missing' },
  { value: 'recent', label: `Recent (${RECENT_DAYS} days)` },
  { value: 'history', label: 'History' },
] as const

type ServicePageProps = {
  vehicles: VehicleSummary[]
  alerts: MaintenanceAlert[]
  records: ServiceRecord[]
  filters: ServiceFilters
}

export default function ServicePage({
  vehicles,
  alerts,
  records,
  filters,
}: ServicePageProps) {
  const navigate = useNavigate({ from: '/service' })
  const router = useRouter()
  const { refreshAlerts } = useGarageAlerts()
  const status = filters.status ?? 'all'
  const vehicleId = filters.vehicle ?? ''
  const type = filters.type ?? ''

  const types = useMemo(() => {
    const extras = records
      .map((record) => record.type)
      .filter((name) => !(MAINTENANCE_TYPES as readonly string[]).includes(name))
    return [...MAINTENANCE_TYPES.filter((name) => name !== 'Other'), ...unique(extras)]
  }, [records])

  const showHistory = status === 'all' || status === 'history' || status === 'recent'
  const alertStatusFilter =
    status === 'overdue' || status === 'due-soon' || status === 'missing'

  const filteredAlerts = useMemo(() => {
    if (status === 'history' || status === 'recent') return []
    return alerts.filter((alert) => {
      if (status !== 'all' && alert.severity !== status) return false
      if (vehicleId && alert.vehicleId !== vehicleId) return false
      if (type && !alert.title.toLowerCase().includes(type.toLowerCase())) return false
      return true
    })
  }, [alerts, status, type, vehicleId])

  const filteredRecords = useMemo(() => {
    if (!showHistory) return []
    const now = new Date()
    return records.filter((record) => {
      if (vehicleId && record.vehicleId !== vehicleId) return false
      if (type && record.type !== type) return false
      if (status === 'recent' && !isRecent(record.date, now)) return false
      return true
    })
  }, [records, showHistory, status, type, vehicleId])

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId)

  const statsAlerts = useMemo(
    () => (vehicleId ? alerts.filter((alert) => alert.vehicleId === vehicleId) : alerts),
    [alerts, vehicleId],
  )
  const statsRecords = useMemo(
    () => (vehicleId ? records.filter((record) => record.vehicleId === vehicleId) : records),
    [records, vehicleId],
  )

  function setFilter(patch: Partial<ServiceFilters>) {
    const nextStatus = patch.status ?? filters.status ?? 'all'
    const nextVehicle = 'vehicle' in patch ? patch.vehicle : filters.vehicle
    const nextType = 'type' in patch ? patch.type : filters.type
    void navigate({
      search: {
        status: nextStatus === 'all' ? undefined : nextStatus,
        vehicle: emptyToUndef(nextVehicle),
        type: emptyToUndef(nextType),
      },
      replace: true,
    })
  }

  async function afterGarageChange() {
    await router.invalidate()
    await refreshAlerts()
  }

  async function handleAdd(values: MaintenanceInput) {
    await addMaintenanceRecord({ data: values })
    await afterGarageChange()
    await navigate({
      search: {
        status: filters.status,
        vehicle: filters.vehicle,
        type: filters.type,
      },
      replace: true,
    })
  }

  async function handleDelete(id: string) {
    await deleteMaintenanceRecord({ data: { id } })
    await afterGarageChange()
  }

  async function handleUpdate(id: string, values: MaintenanceInput) {
    await updateMaintenanceRecord({ data: { ...values, id } })
    await afterGarageChange()
  }

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-caps">Garage</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Service</h1>
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={vehicles.length === 0}
          onClick={() =>
            void navigate({
              search: { ...filters, log: true },
            })
          }
        >
          <Plus className="size-4" />
          Log service
        </button>
      </div>

      {vehicles.length > 0 ? (
        <ServiceStats
          alerts={statsAlerts}
          records={statsRecords}
          activeStatus={status}
          onSelectStatus={(next) => setFilter({ status: next === status ? 'all' : next })}
        />
      ) : null}

      <section className="garage-panel">
        <div className="grid gap-3 border-b border-garage-border p-4 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="label-caps">Status</span>
            <select
              className="field"
              value={status}
              onChange={(e) =>
                setFilter({
                  status: e.target.value as ServiceFilters['status'],
                })
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="label-caps">Vehicle</span>
            <select
              className="field"
              value={vehicleId}
              onChange={(e) => setFilter({ vehicle: e.target.value })}
            >
              <option value="">All vehicles</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="label-caps">Type</span>
            <select
              className="field"
              value={type}
              onChange={(e) => setFilter({ type: e.target.value })}
            >
              <option value="">All types</option>
              {types.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-8 p-4 md:p-6">
          {vehicles.length === 0 ? (
            <p className="text-sm text-garage-muted">
              Add a vehicle before logging service.{' '}
              <Link to="/" search={{ add: true }} className="text-garage-text underline">
                Add vehicle
              </Link>
            </p>
          ) : (
            <>
              {alertStatusFilter ? (
                <section className="space-y-3">
                  <p className="label-caps">Alerts</p>
                  <MaintenanceAlertRows
                    alerts={filteredAlerts}
                    linkToVehicleService
                    emptyMessage="No alerts for this filter."
                  />
                </section>
              ) : null}

              {showHistory ? (
                <section className="space-y-3">
                  <p className="label-caps">History</p>
                  <MaintenanceList
                    records={filteredRecords}
                    showVehicle={!vehicleId}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                </section>
              ) : null}
            </>
          )}
        </div>
      </section>

      <Modal
        open={Boolean(filters.log)}
        onClose={() =>
          void navigate({
            search: {
              status: filters.status,
              vehicle: filters.vehicle,
              type: filters.type,
            },
            replace: true,
          })
        }
        hint="Maintenance"
        title="Log service"
      >
        <MaintenanceForm
          vehicleId={selectedVehicle?.id}
          vehicles={vehicles.map((vehicle) => ({
            id: vehicle.id,
            label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            mileage: vehicle.mileage,
          }))}
          defaultMileage={selectedVehicle?.mileage}
          onSubmit={handleAdd}
          onCancel={() =>
            void navigate({
              search: {
                status: filters.status,
                vehicle: filters.vehicle,
                type: filters.type,
              },
              replace: true,
            })
          }
        />
      </Modal>
    </PageShell>
  )
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

function emptyToUndef(value?: string) {
  return value ? value : undefined
}
