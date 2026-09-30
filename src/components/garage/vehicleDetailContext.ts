import { getRouteApi } from '@tanstack/react-router'

import { parseVehicleDetailTab } from '@/components/garage/VehicleDetailTabs'
import type { VehicleDetail } from '@/lib/vehicleTypes'

const vehicleRoute = getRouteApi('/vehicles/$vehicleId')

export function useVehicleDetailContext() {
  const { vehicle } = vehicleRoute.useLoaderData()
  const search = vehicleRoute.useSearch()
  const tab = parseVehicleDetailTab(search.tab)
  return { vehicle, search, tab }
}

export type VehicleDetailContext = {
  vehicle: VehicleDetail
  search: {
    tab?: 'service' | 'media'
    edit?: boolean
    log?: boolean
  }
  tab: ReturnType<typeof parseVehicleDetailTab>
}
