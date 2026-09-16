import { useState } from 'react'

import { MAINTENANCE_TYPES } from '@/data/vehicleCatalog'
import type { MaintenanceInput } from '@/lib/vehicleTypes'

type MaintenanceFormProps = {
  vehicleId: string
  onSubmit: (values: MaintenanceInput) => Promise<void>
}

export default function MaintenanceForm({
  vehicleId,
  onSubmit,
}: MaintenanceFormProps) {
  const [values, setValues] = useState({
    type: 'Oil change',
    customType: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    cost: '',
    mileage: '',
    serviceProvider: '',
    nextDueDate: '',
    nextDueMileage: '',
  })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const type =
      values.type === 'Other' ? values.customType.trim() : values.type
    try {
      await onSubmit({
        vehicleId,
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
      setValues({
        type: 'Oil change',
        customType: '',
        date: new Date().toISOString().slice(0, 10),
        description: '',
        cost: '',
        mileage: '',
        serviceProvider: '',
        nextDueDate: '',
        nextDueMileage: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-garage-border p-4">
      <p className="label-caps">Log service</p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="label-caps">Type *</span>
          <select
            className="field"
            value={values.type}
            onChange={(e) => setValues({ ...values, type: e.target.value })}
            required
          >
            {MAINTENANCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
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
          <span className="label-caps">Mileage</span>
          <input
            className="field"
            type="number"
            min={0}
            value={values.mileage}
            onChange={(e) => setValues({ ...values, mileage: e.target.value })}
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
        <span className="label-caps">Service provider</span>
        <input
          className="field"
          value={values.serviceProvider}
          onChange={(e) =>
            setValues({ ...values, serviceProvider: e.target.value })
          }
        />
      </label>
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
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Saving…' : 'Add record'}
      </button>
    </form>
  )
}
