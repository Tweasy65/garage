import { Link, Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'

import GarageRouteError from '@/components/garage/GarageRouteError'
import PageShell from '@/components/garage/PageShell'
import VehicleDetailTabs, {
  parseVehicleDetailTab,
  type VehicleDetailTab,
} from '@/components/garage/VehicleDetailTabs'
import VehicleHero from '@/components/garage/VehicleHero'
import { parseTruthyFlag } from '@/lib/searchParams'
import { getVehicle } from '@/server/vehicles'

export type VehicleDetailSearch = {
  tab?: VehicleDetailTab
  edit?: boolean
  log?: boolean
}

export const Route = createFileRoute('/vehicles/$vehicleId')({
  validateSearch: (search: Record<string, unknown>): VehicleDetailSearch => {
    const tab = parseVehicleDetailTab(search.tab)
    return {
      tab: tab === 'specs' ? undefined : tab,
      edit: parseTruthyFlag(search.edit),
      log: parseTruthyFlag(search.log),
    }
  },
  loader: ({ params }) => getVehicle({ data: { id: params.vehicleId } }),
  component: VehicleLayout,
  errorComponent: (props) => (
    <GarageRouteError
      {...props}
      backTo="/"
      backLabel="Back to collection"
    />
  ),
})

function VehicleLayout() {
  const { vehicle } = Route.useLoaderData()
  const search = Route.useSearch()
  const tab = parseVehicleDetailTab(search.tab)
  const navigate = useNavigate({ from: '/vehicles/$vehicleId' })
  const activeTab =
    tab === 'project' && !vehicle.isProject ? 'specs' : tab

  function openEdit() {
    void navigate({ search: (prev) => ({ ...prev, edit: true }) })
  }

  function openLogService() {
    void navigate({ search: (prev) => ({ ...prev, tab: 'service', log: true }) })
  }

  return (
    <PageShell>
      <Link
        to="/"
        className="inline-block text-sm text-garage-muted hover:text-garage-text"
      >
        ← Collection
      </Link>
      <VehicleHero
        vehicle={vehicle}
        onEdit={openEdit}
        onLogService={openLogService}
      />
      <div className="garage-panel overflow-hidden">
        <VehicleDetailTabs
          vehicleId={vehicle.id}
          active={activeTab}
          isProject={vehicle.isProject}
          search={{ edit: search.edit, log: search.log }}
        />
        <Outlet />
      </div>
    </PageShell>
  )
}
