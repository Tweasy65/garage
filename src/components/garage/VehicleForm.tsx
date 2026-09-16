import { useEffect, useMemo, useState } from 'react'

import VehicleImageField from '@/components/garage/VehicleImageField'
import {
  BODY_STYLES,
  DRIVETRAINS,
  FUEL_TYPES,
  TITLE_STATUSES,
  TRANSMISSIONS,
  US_MAKES,
  modelsForMake,
  yearOptions,
} from '@/data/vehicleCatalog'
import type { VehicleInput } from '@/lib/vehicleTypes'

type VehicleFormProps = {
  initial?: Partial<VehicleInput>
  submitLabel: string
  onSubmit: (values: VehicleInput) => Promise<void>
  onCancel?: () => void
}

const OTHER = 'Other'
const YEARS = yearOptions()

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
  drivetrain: '',
  titleStatus: '',
  imageUrl: '',
  tags: [],
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  )
}

function isKnownMake(make: string): boolean {
  return (US_MAKES as readonly string[]).includes(make)
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
  const [customMake, setCustomMake] = useState(
    initial?.make && !isKnownMake(initial.make) ? initial.make : '',
  )
  const [customModel, setCustomModel] = useState('')
  const [remoteModels, setRemoteModels] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedMake =
    customMake ||
    (isKnownMake(values.make) ? values.make : values.make ? OTHER : '')

  const localModels = modelsForMake(values.make)
  const models = useMemo(
    () => uniqueSorted([...localModels, ...remoteModels]),
    [localModels, remoteModels],
  )

  useEffect(() => {
    if (!values.make || selectedMake === OTHER) {
      setRemoteModels([])
      return
    }

    const controller = new AbortController()
    const make = values.make
    void fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`,
      { signal: controller.signal },
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((json: { Results?: Array<{ Model_Name?: string }> } | null) => {
        const names = (json?.Results ?? [])
          .map((row) => row.Model_Name?.trim())
          .filter((name): name is string => Boolean(name))
        setRemoteModels(uniqueSorted(names))
      })
      .catch(() => {
        setRemoteModels([])
      })

    return () => controller.abort()
  }, [values.make, selectedMake])

  useEffect(() => {
    if (values.model && models.length > 0 && !models.includes(values.model)) {
      setCustomModel(values.model)
    }
  }, [models, values.model])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const make = selectedMake === OTHER ? customMake.trim() : values.make.trim()
    const model =
      values.model === OTHER || !models.includes(values.model)
        ? customModel.trim() || values.model.trim()
        : values.model.trim()
    try {
      await onSubmit({
        ...values,
        make,
        model,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Year" required>
          <select
            className="field"
            value={values.year}
            onChange={(e) =>
              setValues({ ...values, year: Number(e.target.value) })
            }
            required
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Make" required>
          <select
            className="field"
            value={selectedMake}
            onChange={(e) => {
              const next = e.target.value
              if (next === OTHER) {
                setCustomMake(customMake || '')
                setValues({ ...values, make: '', model: '' })
              } else {
                setCustomMake('')
                setValues({ ...values, make: next, model: '' })
              }
            }}
            required
          >
            <option value="">Select make</option>
            {US_MAKES.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
            <option value={OTHER}>Other</option>
          </select>
        </Field>
        <Field label="Model" required>
          <select
            className="field"
            value={
              models.includes(values.model) ? values.model : customModel ? OTHER : values.model
            }
            onChange={(e) => {
              const next = e.target.value
              if (next === OTHER) {
                setValues({ ...values, model: OTHER })
              } else {
                setCustomModel('')
                setValues({ ...values, model: next })
              }
            }}
            required={selectedMake !== OTHER && !customMake}
            disabled={!values.make && selectedMake !== OTHER}
          >
            <option value="">Select model</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
            <option value={OTHER}>Other</option>
          </select>
        </Field>
      </div>

      {selectedMake === OTHER ? (
        <Field label="Custom make" required>
          <input
            className="field"
            value={customMake}
            onChange={(e) => {
              setCustomMake(e.target.value)
              setValues({ ...values, make: e.target.value })
            }}
            required
          />
        </Field>
      ) : null}

      {values.model === OTHER || (customModel && !models.includes(values.model)) ? (
        <Field label="Custom model" required>
          <input
            className="field"
            value={customModel}
            onChange={(e) => {
              setCustomModel(e.target.value)
              setValues({ ...values, model: e.target.value })
            }}
            required
          />
        </Field>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
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
        <Field label="Odometer (mi)">
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
        <Field label="Body style">
          <select
            className="field"
            value={values.bodyStyle ?? ''}
            onChange={(e) =>
              setValues({ ...values, bodyStyle: e.target.value })
            }
          >
            <option value="">Select</option>
            {BODY_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Transmission">
          <select
            className="field"
            value={values.transmission ?? ''}
            onChange={(e) =>
              setValues({ ...values, transmission: e.target.value })
            }
          >
            <option value="">Select</option>
            {TRANSMISSIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Drivetrain">
          <select
            className="field"
            value={values.drivetrain ?? ''}
            onChange={(e) =>
              setValues({ ...values, drivetrain: e.target.value })
            }
          >
            <option value="">Select</option>
            {DRIVETRAINS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fuel type">
          <select
            className="field"
            value={values.fuelType ?? ''}
            onChange={(e) =>
              setValues({ ...values, fuelType: e.target.value })
            }
          >
            <option value="">Select</option>
            {FUEL_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title status">
          <select
            className="field"
            value={values.titleStatus ?? ''}
            onChange={(e) =>
              setValues({ ...values, titleStatus: e.target.value })
            }
          >
            <option value="">Select</option>
            {TITLE_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
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
      </div>

      <VehicleImageField
        year={values.year}
        make={selectedMake === OTHER ? customMake : values.make}
        model={customModel || values.model}
        value={values.imageUrl ?? ''}
        onChange={(imageUrl) => setValues({ ...values, imageUrl })}
      />

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
      <span className="label-caps">
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  )
}
