import { Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { VehicleDetail } from '@/lib/vehicleTypes'
import {
  buildVehicleSpecSections,
  firstSpecSectionWithData,
  type VehicleSpecSectionId,
} from '@/lib/vehicleSpecGroups'

type VehicleOverviewTabProps = {
  vehicle: VehicleDetail
  onDelete: () => void
}

export default function VehicleOverviewTab({
  vehicle,
  onDelete,
}: VehicleOverviewTabProps) {
  const sections = useMemo(() => buildVehicleSpecSections(vehicle), [vehicle])
  const [activeSection, setActiveSection] = useState<VehicleSpecSectionId>(() =>
    firstSpecSectionWithData(sections),
  )

  useEffect(() => {
    setActiveSection((current) => {
      const currentHasRows = sections.find((s) => s.id === current)?.rows.length
      if (currentHasRows) return current
      return firstSpecSectionWithData(sections)
    })
  }, [sections])

  const active = sections.find((section) => section.id === activeSection) ?? sections[0]
  const hasAnySpecs = sections.some((section) => section.rows.length > 0)

  return (
    <div role="tabpanel" id="vehicle-tab-specs" aria-labelledby="tab-specs">
      <div className="section-header">
        <div>
          <p className="label-caps">Vehicle</p>
          <h2 className="mt-1 text-base font-semibold">Specifications</h2>
        </div>
      </div>

      <div className="spec-layout">
        <nav className="spec-nav hide-scrollbar" aria-label="Specification sections">
          {sections.map((section) => {
            const selected = section.id === activeSection
            return (
              <button
                key={section.id}
                type="button"
                aria-current={selected ? 'true' : undefined}
                className={`spec-nav-item ${selected ? 'spec-nav-item-active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span>{section.title}</span>
                {section.rows.length > 0 ? (
                  <span className="spec-nav-count">{section.rows.length}</span>
                ) : null}
              </button>
            )
          })}
        </nav>

        <div className="spec-panel">
          <p className="label-caps mb-3">{active.title}</p>
          {active.rows.length > 0 ? (
            <dl className="data-rows">
              {active.rows.map(([label, value]) => (
                <div key={label} className="data-row">
                  <dt className="data-row-label">{label}</dt>
                  <dd className="data-row-value">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-garage-muted">
              {hasAnySpecs
                ? active.emptyHint
                : 'No specs yet. Use edit vehicle to add registration and mechanical details.'}
            </p>
          )}
        </div>
      </div>

      <div className="section-body space-y-8 border-t border-garage-border">
        {vehicle.notes ? (
          <div>
            <p className="label-caps mb-2">Notes</p>
            <p className="max-w-prose text-sm leading-relaxed text-garage-muted">
              {vehicle.notes}
            </p>
          </div>
        ) : null}

        {vehicle.tags.length > 0 ? (
          <div>
            <p className="label-caps mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {vehicle.tags.map((tag) => (
                <span key={tag} className="badge">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-garage-border px-6 py-5">
        <p className="label-caps text-red-300/80">Danger zone</p>
        <p className="mt-2 max-w-prose text-sm text-garage-muted">
          Deleting removes this vehicle and every maintenance record tied to it.
        </p>
        <button
          type="button"
          onClick={onDelete}
          className="btn mt-4 border-red-400/30 text-red-300 hover:bg-red-400/10"
        >
          <Trash2 className="size-4" />
          Delete vehicle
        </button>
      </div>
    </div>
  )
}
