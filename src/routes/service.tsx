import { Show } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

import ServicePage, {
  type ServiceFilters,
} from '@/components/garage/ServicePage'
import SignInLanding from '@/components/garage/SignInLanding'
import { listService } from '@/server/vehicles'

export const Route = createFileRoute('/service')({
  validateSearch: (search: Record<string, unknown>): ServiceFilters => ({
    status: parseStatus(search.status),
    vehicle: typeof search.vehicle === 'string' ? search.vehicle : undefined,
    type: typeof search.type === 'string' ? search.type : undefined,
    log:
      search.log === true || search.log === '1' || search.log === 'true'
        ? true
        : undefined,
  }),
  loader: () => listService(),
  component: ServiceRoute,
})

function ServiceRoute() {
  const data = Route.useLoaderData()
  const filters = Route.useSearch()
  return (
    <>
      <Show when="signed-in">
        <ServicePage
          vehicles={data.vehicles}
          alerts={data.alerts}
          records={data.records}
          filters={filters}
        />
      </Show>
      <Show when="signed-out">
        <SignInLanding />
      </Show>
    </>
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
