import { createFileRoute } from '@tanstack/react-router'

import GarageApp from '@/components/garage/GarageApp'
import { listVehicles } from '@/server/vehicles'

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: () => listVehicles(),
})

function HomePage() {
  const { vehicles, alerts } = Route.useLoaderData()
  return <GarageApp initialVehicles={vehicles} initialAlerts={alerts} />
}
