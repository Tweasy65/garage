import { createFileRoute } from '@tanstack/react-router'

import VehicleDetailPage from '@/components/garage/VehicleDetailPage'

export const Route = createFileRoute('/vehicles/$vehicleId/')({
  component: VehicleDetailRoute,
})

function VehicleDetailRoute() {
  return <VehicleDetailPage />
}
