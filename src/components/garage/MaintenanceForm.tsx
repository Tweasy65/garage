import { useState } from 'react'

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
    type: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    cost: '',
    mileage: '',
    serviceProvider: '',
  })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onSubmit({
        vehicleId,
        type: values.type,
        date: values.date,
        description: values.description || null,
        costCents: values.cost
          ? Math.round(Number(values.cost) * 100)
          : null,
        mileage: values.mileage ? Number(values.mileage) : null,
        serviceProvider: values.serviceProvider || null,
      })
      setValues({
        type: '',
        date: new Date().toISOString().slice(0, 10),
        description: '',
        cost: '',
        mileage: '',
        serviceProvider: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="garage-panel space-y-4 p-4">
      <h3 className="font-medium">Add maintenance</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm text-garage-muted">Type *</span>
          <input
            className="field"
            value={values.type}
            onChange={(e) => setValues({ ...values, type: e.target.value })}
            placeholder="Oil change"
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-garage-muted">Date *</span>
          <input
            className="field"
            type="date"
            value={values.date}
            onChange={(e) => setValues({ ...values, date: e.target.value })}
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-garage-muted">Cost ($)</span>
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
          <span className="text-sm text-garage-muted">Mileage</span>
          <input
            className="field"
            type="number"
            min={0}
            value={values.mileage}
            onChange={(e) => setValues({ ...values, mileage: e.target.value })}
          />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm text-garage-muted">Service provider</span>
        <input
          className="field"
          value={values.serviceProvider}
          onChange={(e) =>
            setValues({ ...values, serviceProvider: e.target.value })
          }
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm text-garage-muted">Notes</span>
        <textarea
          className="field min-h-20"
          value={values.description}
          onChange={(e) =>
            setValues({ ...values, description: e.target.value })
          }
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Add record'}
      </button>
    </form>
  )
}
