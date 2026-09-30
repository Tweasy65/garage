import { getRouteApi } from '@tanstack/react-router'

import { parseVehicleDetailTab } from '@/components/garage/VehicleDetailTabs'

const vehicleRoute = getRouteApi('/vehicles/$vehicleId')

export function useVehicleDetailContext() {
  const { vehicle } = vehicleRoute.useLoaderData()
  const search = vehicleRoute.useSearch()
  const tab = parseVehicleDetailTab(search.tab)
  return { vehicle, search, tab }
}
