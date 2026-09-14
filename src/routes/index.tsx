import { createFileRoute } from '@tanstack/react-router'

import GarageApp from '@/components/garage/GarageApp'
import { listVehicles } from '@/server/vehicles'

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: () => listVehicles(),
})

function HomePage() {
  const { vehicles } = Route.useLoaderData()
  return <GarageApp initialVehicles={vehicles} />
}
