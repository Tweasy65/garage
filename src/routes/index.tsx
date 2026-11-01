import { createFileRoute, useNavigate } from '@tanstack/react-router'

import CollectionPage from '@/components/garage/CollectionPage'
import GarageAuthGate from '@/components/garage/GarageAuthGate'
import { parseTruthyFlag } from '@/lib/searchParams'
import { listVehicles } from '@/server/vehicles'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): { add?: boolean } => ({
    add: parseTruthyFlag(search.add),
  }),
  loader: () => listVehicles(),
  component: HomePage,
})

function HomePage() {
  const { vehicles, alerts } = Route.useLoaderData()
  const { add } = Route.useSearch()
  const navigate = useNavigate({ from: '/' })

  return (
    <GarageAuthGate>
      <CollectionPage
        vehicles={vehicles}
        alerts={alerts}
        addOpen={Boolean(add)}
        onOpenAdd={() => void navigate({ search: { add: true } })}
        onCloseAdd={() => void navigate({ search: {}, replace: true })}
      />
    </GarageAuthGate>
  )
}
