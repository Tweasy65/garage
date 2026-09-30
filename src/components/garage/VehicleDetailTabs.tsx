import { Link } from '@tanstack/react-router'

export type VehicleDetailTab = 'overview' | 'service' | 'media'

const TABS: { id: VehicleDetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
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
  if (value === 'service' || value === 'media') return value
  return 'overview'
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
            tab: tab.id === 'overview' ? undefined : tab.id,
            edit: tab.id === active ? search?.edit : undefined,
            log: tab.id === active ? search?.log : undefined,
          }}
          replace
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
