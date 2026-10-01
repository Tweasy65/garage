import { Link } from '@tanstack/react-router'

export type VehicleDetailTab = 'specs' | 'service' | 'media'

const TABS: { id: VehicleDetailTab; label: string }[] = [
  { id: 'specs', label: 'Specs' },
  { id: 'service', label: 'Service' },
  { id: 'media', label: 'Media' },
]

type VehicleDetailTabsProps = {
  vehicleId: string
  active: VehicleDetailTab
  search?: {
    edit?: boolean
    log?: boolean
  }
}

export function parseVehicleDetailTab(value: unknown): VehicleDetailTab {
  if (value === 'alerts') return 'service'
  if (value === 'service' || value === 'media') return value
  if (value === 'overview') return 'specs'
  return 'specs'
}

export default function VehicleDetailTabs({
  vehicleId,
  active,
  search,
}: VehicleDetailTabsProps) {
  return (
    <div
      className="segment-tabs"
      role="tablist"
      aria-label="Vehicle sections"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          to="/vehicles/$vehicleId"
          params={{ vehicleId }}
          search={{
            tab: tab.id === 'specs' ? undefined : tab.id,
            edit: tab.id === active ? search?.edit : undefined,
            log: tab.id === active ? search?.log : undefined,
          }}
          replace
          id={`tab-${tab.id}`}
          role="tab"
          aria-selected={active === tab.id}
          className={`segment-tab ${active === tab.id ? 'segment-tab-active' : ''}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
