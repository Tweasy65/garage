import { getRouteApi } from '@tanstack/react-router'

import { parseVehicleDetailTab } from '@/components/garage/VehicleDetailTabs'

const vehicleRoute = getRouteApi('/vehicles/$vehicleId')

export default function VehicleDetailPage() {
  const search = vehicleRoute.useSearch()
  const tab = parseVehicleDetailTab(search.tab)

  return (
    <div role="tabpanel" aria-label={tab}>
      <p className="section-body text-sm text-garage-muted">Loading tab…</p>
    </div>
  )
}
