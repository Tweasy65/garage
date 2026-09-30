import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import PageShell from '@/components/garage/PageShell'
import SignInLanding from '@/components/garage/SignInLanding'
import VehicleHero from '@/components/garage/VehicleHero'
import { getVehicle } from '@/server/vehicles'

export const Route = createFileRoute('/vehicles/$vehicleId')({
  loader: ({ params }) => getVehicle({ data: { id: params.vehicleId } }),
  component: VehicleLayout,
  errorComponent: VehicleError,
})

function VehicleLayout() {
  const { vehicle } = Route.useLoaderData()

  return (
    <PageShell>
      <Link
        to="/"
        className="inline-block text-sm text-garage-muted hover:text-garage-text"
      >
        ← Collection
      </Link>
      <VehicleHero vehicle={vehicle} />
      <div className="garage-panel">
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
