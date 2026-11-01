import { createFileRoute } from '@tanstack/react-router'

import GarageAuthGate from '@/components/garage/GarageAuthGate'
import ServicePage, {
  type ServiceFilters,
} from '@/components/garage/ServicePage'
import { parseTruthyFlag } from '@/lib/searchParams'
import { listService } from '@/server/vehicles'

export const Route = createFileRoute('/service')({
  validateSearch: (search: Record<string, unknown>): ServiceFilters => ({
    status: parseStatus(search.status),
    vehicle: typeof search.vehicle === 'string' ? search.vehicle : undefined,
    type: typeof search.type === 'string' ? search.type : undefined,
    log: parseTruthyFlag(search.log),
  }),
  loader: () => listService(),
  component: ServiceRoute,
})

function ServiceRoute() {
  const data = Route.useLoaderData()
  const filters = Route.useSearch()
  return (
    <GarageAuthGate>
      <ServicePage
        vehicles={data.vehicles}
        alerts={data.alerts}
        records={data.records}
        filters={filters}
      />
    </GarageAuthGate>
  )
}

function parseStatus(
  value: unknown,
): ServiceFilters['status'] {
  if (
    value === 'all' ||
    value === 'overdue' ||
    value === 'due-soon' ||
    value === 'missing' ||
    value === 'recent' ||
    value === 'history'
  ) {
    return value
  }
  return undefined
}
