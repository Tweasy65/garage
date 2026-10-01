import { useEffect, useMemo, useState } from 'react'

import VehicleAssetsField from '@/components/garage/VehicleAssetsField'
import VehicleTagInput from '@/components/garage/VehicleTagInput'
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
import { modelForVehicle } from '@/data/vehicleModels'
import type { VehicleInput } from '@/lib/vehicleTypes'

type FormTab = 'general' | 'specs' | 'media'

type VehicleFormProps = {
  initial?: Partial<VehicleInput>
  submitLabel: string
  onSubmit: (values: VehicleInput) => Promise<void>
  onCancel?: () => void
  open?: boolean
  entityId?: string
}

const OTHER = 'Other'
const YEARS = yearOptions()

const FORM_TABS: { id: FormTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'specs', label: 'Specs' },
  { id: 'media', label: 'Media' },
]

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
  engineType: '',
  engineSize: '',
  seatingCapacity: null,
  mpgCity: null,
  mpgHighway: null,
  imageUrl: '',
  assets: [],
  modelAssetId: null,
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
  open = true,
  entityId = 'vehicle',
}: VehicleFormProps) {
  const [tab, setTab] = useState<FormTab>('general')
  const [values, setValues] = useState<VehicleInput>({
    ...emptyForm,
    ...initial,
    assets: initial?.assets ?? [],
    modelAssetId: initial?.modelAssetId ?? null,
    tags: initial?.tags ?? [],
  })
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

  const resolvedMake = selectedMake === OTHER ? customMake : values.make
  const resolvedModel =
    values.model === OTHER || (customModel && !models.includes(values.model))
      ? customModel || values.model
      : values.model

  const mediaCount = values.assets?.length ?? 0

  useEffect(() => {
    if (!open) return
    setTab('general')
    setValues({
      ...emptyForm,
      ...initial,
      assets: initial?.assets ?? [],
      modelAssetId: initial?.modelAssetId ?? null,
      tags: initial?.tags ?? [],
    })
    setCustomMake(initial?.make && !isKnownMake(initial.make) ? initial.make : '')
    setCustomModel('')
    setError(null)
  }, [open, entityId])

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
        tags: values.tags ?? [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="segment-tabs shrink-0" role="tablist" aria-label="Edit sections">
        {FORM_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`segment-tab ${tab === item.id ? 'segment-tab-active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.id === 'media' && mediaCount > 0 ? (
              <span className="ml-1.5 tabular-nums text-garage-muted">{mediaCount}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {tab === 'general' ? (
          <div className="space-y-8">
            <Section title="Name" hint="Year, make, and model are required.">
              <div className="grid gap-4 sm:grid-cols-3">
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
                      models.includes(values.model)
                        ? values.model
                        : customModel
                          ? OTHER
                          : values.model
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

              {values.model === OTHER ||
              (customModel && !models.includes(values.model)) ? (
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

              <Field label="Trim">
                <input
                  className="field"
                  value={values.trim ?? ''}
                  onChange={(e) => setValues({ ...values, trim: e.target.value })}
                  placeholder="Optional subtitle shown under the name"
                />
              </Field>
            </Section>

            <Section title="At a glance">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Color">
                  <input
                    className="field"
                    value={values.color ?? ''}
                    onChange={(e) => setValues({ ...values, color: e.target.value })}
                    placeholder="Red, white, #9e0b0f…"
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
              </div>
              {values.modelAssetId ||
              modelForVehicle({
                year: values.year,
                make: resolvedMake,
                model: resolvedModel,
                bodyStyle: values.bodyStyle,
              }) ? (
                <p className="text-sm text-garage-muted">
                  This vehicle can use a 3D showcase model. Set color to red, white, or a hex
                  code to tint paint in the viewer.
                </p>
              ) : null}
            </Section>

            <Section title="Notes & flags">
              <Field label="Tags">
                <VehicleTagInput
                  value={values.tags ?? []}
                  onChange={(tags) => setValues({ ...values, tags })}
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
            </Section>
          </div>
        ) : null}

        {tab === 'specs' ? (
          <div className="space-y-4">
            <p className="text-sm text-garage-muted">
              Registration, mechanical details, and efficiency — same fields shown on the specs
              tab of the vehicle page.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Body style">
                <select
                  className="field"
                  value={values.bodyStyle ?? ''}
                  onChange={(e) => setValues({ ...values, bodyStyle: e.target.value })}
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
                  onChange={(e) => setValues({ ...values, drivetrain: e.target.value })}
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
                  onChange={(e) => setValues({ ...values, fuelType: e.target.value })}
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
              <Field label="Engine type">
                <input
                  className="field"
                  value={values.engineType ?? ''}
                  onChange={(e) =>
                    setValues({ ...values, engineType: e.target.value })
                  }
                  placeholder="V8, I4, electric…"
                />
              </Field>
              <Field label="Engine size">
                <input
                  className="field"
                  value={values.engineSize ?? ''}
                  onChange={(e) =>
                    setValues({ ...values, engineSize: e.target.value })
                  }
                  placeholder="5.0L, 2.3L…"
                />
              </Field>
              <Field label="Seating capacity">
                <input
                  className="field"
                  type="number"
                  min={1}
                  value={values.seatingCapacity ?? ''}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      seatingCapacity: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </Field>
              <Field label="MPG city">
                <input
                  className="field"
                  type="number"
                  min={0}
                  value={values.mpgCity ?? ''}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      mpgCity: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </Field>
              <Field label="MPG highway">
                <input
                  className="field"
                  type="number"
                  min={0}
                  value={values.mpgHighway ?? ''}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      mpgHighway: e.target.value ? Number(e.target.value) : null,
                    })
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
            </div>
          </div>
        ) : null}

        {tab === 'media' ? (
          <VehicleAssetsField
            year={values.year}
            make={resolvedMake}
            model={resolvedModel}
            bodyStyle={values.bodyStyle}
            assets={values.assets ?? []}
            imageUrl={values.imageUrl ?? null}
            modelAssetId={values.modelAssetId ?? null}
            onChange={(next) => setValues({ ...values, ...next })}
          />
        ) : null}
      </div>

      <div className="shrink-0 space-y-3 border-t border-garage-border px-5 py-4">
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
      </div>
    </form>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <p className="label-caps">{title}</p>
        {hint ? <p className="mt-1 text-sm text-garage-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
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
