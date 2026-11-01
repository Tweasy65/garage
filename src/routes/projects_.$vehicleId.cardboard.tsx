import { createFileRoute } from '@tanstack/react-router'

import CardboardPage from '@/components/garage/CardboardPage'
import GarageAuthGate from '@/components/garage/GarageAuthGate'
import GarageRouteError from '@/components/garage/GarageRouteError'
import { getVehicle } from '@/server/vehicles'

export const Route = createFileRoute('/projects_/$vehicleId/cardboard')({
  loader: ({ params }) => getVehicle({ data: { id: params.vehicleId } }),
  component: CardboardRoute,
  errorComponent: (props) => (
    <GarageRouteError
      {...props}
      backTo="/projects"
      backLabel="Back to projects"
    />
  ),
})

function CardboardRoute() {
  const { vehicle } = Route.useLoaderData()
  return (
    <GarageAuthGate>
      <CardboardPage vehicle={vehicle} />
    </GarageAuthGate>
  )
}
