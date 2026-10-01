import { useEffect, useState } from 'react'

import { MAINTENANCE_TYPES } from '@/data/vehicleCatalog'
import type { MaintenanceInput, MaintenanceRecord } from '@/lib/vehicleTypes'

type VehicleOption = {
  id: string
  label: string
  mileage: number
}

type MaintenanceFormProps = {
  vehicleId?: string
  vehicles?: VehicleOption[]
  defaultMileage?: number
  initialRecord?: MaintenanceRecord | null
  submitLabel?: string
  onSubmit: (values: MaintenanceInput) => Promise<void>
  onCancel?: () => void
}

export default function MaintenanceForm({
  vehicleId,
  vehicles,
  defaultMileage,
  initialRecord,
  submitLabel = 'Add record',
  onSubmit,
  onCancel,
}: MaintenanceFormProps) {
  const editing = Boolean(initialRecord)
  const [selectedId, setSelectedId] = useState(
    vehicleId ?? initialRecord?.vehicleId ?? vehicles?.[0]?.id ?? '',
  )
  const selected = vehicles?.find((vehicle) => vehicle.id === selectedId)
  const mileageDefault = selected?.mileage ?? defaultMileage
  const [values, setValues] = useState(() =>
    initialRecord
      ? recordToFormValues(initialRecord)
      : emptyValues(mileageDefault),
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const showVehicleSelect =
    !editing && (vehicles?.length ?? 0) > 1 && !vehicleId

  useEffect(() => {
    if (initialRecord) {
      setSelectedId(initialRecord.vehicleId)
      setValues(recordToFormValues(initialRecord))
      return
    }
    const nextId = vehicleId ?? vehicles?.[0]?.id ?? ''
    setSelectedId(nextId)
    const nextMileage =
      vehicles?.find((vehicle) => vehicle.id === nextId)?.mileage ?? defaultMileage
    setValues((current) => ({
      ...current,
      mileage: nextMileage != null ? String(nextMileage) : current.mileage,
    }))
  }, [defaultMileage, initialRecord, vehicleId, vehicles])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const type =
      values.type === 'Other' ? values.customType.trim() : values.type
    const nextVehicleId = vehicleId || selectedId
    if (!nextVehicleId) {
      setPending(false)
      setError('Choose a vehicle')
      return
    }
    try {
      await onSubmit({
        vehicleId: nextVehicleId,
        type,
        date: values.date,
        description: values.description || null,
        costCents: values.cost ? Math.round(Number(values.cost) * 100) : null,
        mileage: values.mileage ? Number(values.mileage) : null,
        serviceProvider: values.serviceProvider || null,
        nextDueDate: values.nextDueDate || null,
        nextDueMileage: values.nextDueMileage
          ? Number(values.nextDueMileage)
          : null,
      })
      if (!editing) {
        setValues(emptyValues(values.mileage ? Number(values.mileage) : mileageDefault))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {showVehicleSelect || (!vehicleId && !editing && (vehicles?.length ?? 0) > 0) ? (
          <label className="block space-y-1.5 md:col-span-2">
            <span className="label-caps">Vehicle *</span>
            <select
              className="field"
              value={selectedId}
              onChange={(e) => {
                const id = e.target.value
                setSelectedId(id)
                const miles = vehicles?.find((vehicle) => vehicle.id === id)?.mileage
                setValues((current) => ({
                  ...current,
                  mileage: miles != null ? String(miles) : current.mileage,
                }))
              }}
              required
            >
              <option value="">Select vehicle</option>
              {vehicles?.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block space-y-1.5">
          <span className="label-caps">Type *</span>
          <select
            className="field"
            value={values.type}
            onChange={(e) => setValues({ ...values, type: e.target.value })}
            required
          >
            {MAINTENANCE_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        {values.type === 'Other' ? (
          <label className="block space-y-1.5">
            <span className="label-caps">Custom type *</span>
            <input
              className="field"
              value={values.customType}
              onChange={(e) =>
                setValues({ ...values, customType: e.target.value })
              }
              required
            />
          </label>
        ) : null}
        <label className="block space-y-1.5">
          <span className="label-caps">Date *</span>
          <input
            className="field"
            type="date"
            value={values.date}
            onChange={(e) => setValues({ ...values, date: e.target.value })}
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="label-caps">Odometer (mi)</span>
          <input
            className="field"
            type="number"
            min={0}
            value={values.mileage}
            onChange={(e) => setValues({ ...values, mileage: e.target.value })}
            placeholder={mileageDefault ? String(mileageDefault) : undefined}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="label-caps">Cost ($)</span>
          <input
            className="field"
            type="number"
            min={0}
            step="0.01"
            value={values.cost}
            onChange={(e) => setValues({ ...values, cost: e.target.value })}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="label-caps">Shop / provider</span>
          <input
            className="field"
            value={values.serviceProvider}
            onChange={(e) =>
              setValues({ ...values, serviceProvider: e.target.value })
            }
          />
        </label>
        <label className="block space-y-1.5">
          <span className="label-caps">Next due date</span>
          <input
            className="field"
            type="date"
            value={values.nextDueDate}
            onChange={(e) =>
              setValues({ ...values, nextDueDate: e.target.value })
            }
          />
        </label>
        <label className="block space-y-1.5">
          <span className="label-caps">Next due mileage</span>
          <input
            className="field"
            type="number"
            min={0}
            value={values.nextDueMileage}
            onChange={(e) =>
              setValues({ ...values, nextDueMileage: e.target.value })
            }
          />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="label-caps">Notes</span>
        <textarea
          className="field min-h-20"
          value={values.description}
          onChange={(e) =>
            setValues({ ...values, description: e.target.value })
          }
        />
      </label>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Saving…' : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="btn">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}

function emptyValues(mileage?: number) {
  return {
    type: 'Oil change',
    customType: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    cost: '',
    mileage: mileage != null ? String(mileage) : '',
    serviceProvider: '',
    nextDueDate: '',
    nextDueMileage: '',
  }
}

function recordToFormValues(record: MaintenanceRecord) {
  const knownType = (MAINTENANCE_TYPES as readonly string[]).includes(record.type)
  return {
    type: knownType ? record.type : 'Other',
    customType: knownType ? '' : record.type,
    date: record.date.slice(0, 10),
    description: record.description ?? '',
    cost: record.costCents != null ? String(record.costCents / 100) : '',
    mileage: record.mileage != null ? String(record.mileage) : '',
    serviceProvider: record.serviceProvider ?? '',
    nextDueDate: record.nextDueDate?.slice(0, 10) ?? '',
    nextDueMileage:
      record.nextDueMileage != null ? String(record.nextDueMileage) : '',
  }
}
