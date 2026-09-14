import { useState } from 'react'

import type { VehicleInput } from '@/lib/vehicleTypes'

type VehicleFormProps = {
  initial?: Partial<VehicleInput>
  submitLabel: string
  onSubmit: (values: VehicleInput) => Promise<void>
  onCancel?: () => void
}

const emptyForm: VehicleInput = {
  make: '',
  model: '',
  trim: '',
  year: new Date().getFullYear(),
  color: '',
  mileage: 0,
  vin: '',
  licensePlate: '',
  purchaseDate: '',
  notes: '',
  isProject: false,
  isFavorite: false,
  bodyStyle: '',
  transmission: '',
  fuelType: '',
  imageUrl: '',
  tags: [],
}

export default function VehicleForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: VehicleFormProps) {
  const [values, setValues] = useState<VehicleInput>({
    ...emptyForm,
    ...initial,
    tags: initial?.tags ?? [],
  })
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(', '))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onSubmit({
        ...values,
        tags: tagsText
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Make" required>
          <input
            className="field"
            value={values.make}
            onChange={(e) => setValues({ ...values, make: e.target.value })}
            required
          />
        </Field>
        <Field label="Model" required>
          <input
            className="field"
            value={values.model}
            onChange={(e) => setValues({ ...values, model: e.target.value })}
            required
          />
        </Field>
        <Field label="Year" required>
          <input
            className="field"
            type="number"
            min={1886}
            max={2100}
            value={values.year}
            onChange={(e) =>
              setValues({ ...values, year: Number(e.target.value) })
            }
            required
          />
        </Field>
        <Field label="Trim">
          <input
            className="field"
            value={values.trim ?? ''}
            onChange={(e) => setValues({ ...values, trim: e.target.value })}
          />
        </Field>
        <Field label="Color">
          <input
            className="field"
            value={values.color ?? ''}
            onChange={(e) => setValues({ ...values, color: e.target.value })}
          />
        </Field>
        <Field label="Mileage">
          <input
            className="field"
            type="number"
            min={0}
            value={values.mileage}
            onChange={(e) =>
              setValues({ ...values, mileage: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="VIN">
          <input
            className="field"
            value={values.vin ?? ''}
            onChange={(e) => setValues({ ...values, vin: e.target.value })}
          />
        </Field>
        <Field label="License plate">
          <input
            className="field"
            value={values.licensePlate ?? ''}
            onChange={(e) =>
              setValues({ ...values, licensePlate: e.target.value })
            }
          />
        </Field>
        <Field label="Purchase date">
          <input
            className="field"
            type="date"
            value={values.purchaseDate ?? ''}
            onChange={(e) =>
              setValues({ ...values, purchaseDate: e.target.value })
            }
          />
        </Field>
        <Field label="Image URL">
          <input
            className="field"
            value={values.imageUrl ?? ''}
            onChange={(e) =>
              setValues({ ...values, imageUrl: e.target.value })
            }
            placeholder="https://..."
          />
        </Field>
      </div>

      <Field label="Tags">
        <input
          className="field"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="Daily, Project, For Sale"
        />
      </Field>

      <Field label="Notes">
        <textarea
          className="field min-h-24"
          value={values.notes ?? ''}
          onChange={(e) => setValues({ ...values, notes: e.target.value })}
        />
      </Field>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-garage-muted">
          <input
            type="checkbox"
            checked={values.isProject}
            onChange={(e) =>
              setValues({ ...values, isProject: e.target.checked })
            }
          />
          Project vehicle
        </label>
        <label className="flex items-center gap-2 text-sm text-garage-muted">
          <input
            type="checkbox"
            checked={values.isFavorite}
            onChange={(e) =>
              setValues({ ...values, isFavorite: e.target.checked })
            }
          />
          Favorite
        </label>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-garage-accent px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-garage-border px-5 py-2 text-sm text-garage-muted"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-garage-muted">
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  )
}
