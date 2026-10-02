import { Link } from '@tanstack/react-router'

export type VehicleDetailTab = 'specs' | 'project' | 'service' | 'media'

type VehicleDetailTabsProps = {
  vehicleId: string
  active: VehicleDetailTab
  isProject?: boolean
  search?: {
    edit?: boolean
    log?: boolean
  }
}

export function parseVehicleDetailTab(value: unknown): VehicleDetailTab {
  if (value === 'alerts') return 'service'
  if (value === 'project' || value === 'service' || value === 'media') {
    return value
  }
  if (value === 'overview') return 'specs'
  return 'specs'
}

export default function VehicleDetailTabs({
  vehicleId,
  active,
  isProject,
  search,
}: VehicleDetailTabsProps) {
  const tabs: { id: VehicleDetailTab; label: string }[] = [
    { id: 'specs', label: 'Specs' },
    ...(isProject ? [{ id: 'project' as const, label: 'Project' }] : []),
    { id: 'service', label: 'Service' },
    { id: 'media', label: 'Media' },
  ]

  return (
    <div
      className="segment-tabs"
      role="tablist"
      aria-label="Vehicle sections"
    >
      {tabs.map((tab) => (
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
