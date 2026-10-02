import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link, Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'

import PageShell from '@/components/garage/PageShell'
import SignInLanding from '@/components/garage/SignInLanding'
import VehicleDetailTabs, {
  parseVehicleDetailTab,
  type VehicleDetailTab,
} from '@/components/garage/VehicleDetailTabs'
import VehicleHero from '@/components/garage/VehicleHero'
import { getVehicle } from '@/server/vehicles'
export type VehicleDetailSearch = {
  tab?: VehicleDetailTab
  edit?: boolean
  log?: boolean
}

function parseFlag(value: unknown): boolean | undefined {
  if (value === true || value === '1' || value === 'true') return true
  return undefined
}

export const Route = createFileRoute('/vehicles/$vehicleId')({
  validateSearch: (search: Record<string, unknown>): VehicleDetailSearch => {
    const tab = parseVehicleDetailTab(search.tab)
    return {
      tab: tab === 'specs' ? undefined : tab,
      edit: parseFlag(search.edit),
      log: parseFlag(search.log),
    }
  },
  loader: ({ params }) => getVehicle({ data: { id: params.vehicleId } }),
  component: VehicleLayout,
  errorComponent: VehicleError,
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

function VehicleError({ error }: ErrorComponentProps) {
  const message =
    error instanceof Error ? error.message : 'Something went wrong'
  if (message.toLowerCase().includes('sign in')) {
    return <SignInLanding />
  }
  return (
    <PageShell>
      <div className="garage-panel px-8 py-12 text-center">
        <p className="label-caps">Missing</p>
        <h1 className="mt-3 text-2xl font-semibold">Vehicle not found</h1>
        <p className="mt-2 text-sm text-garage-muted">{message}</p>
        <Link to="/" className="btn-primary mt-8">
          Back to collection
        </Link>
      </div>
    </PageShell>
  )
}
