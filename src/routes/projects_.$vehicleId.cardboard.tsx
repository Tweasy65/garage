import { Show } from '@clerk/tanstack-react-start'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link, createFileRoute } from '@tanstack/react-router'

import CardboardPage from '@/components/garage/CardboardPage'
import PageShell from '@/components/garage/PageShell'
import SignInLanding from '@/components/garage/SignInLanding'
import { getVehicle } from '@/server/vehicles'

export const Route = createFileRoute('/projects_/$vehicleId/cardboard')({
  loader: ({ params }) => getVehicle({ data: { id: params.vehicleId } }),
  component: CardboardRoute,
  errorComponent: CardboardError,
})

function CardboardRoute() {
  const { vehicle } = Route.useLoaderData()
  return (
    <>
      <Show when="signed-in">
        <CardboardPage vehicle={vehicle} />
      </Show>
      <Show when="signed-out">
        <SignInLanding />
      </Show>
    </>
  )
}

function CardboardError({ error }: ErrorComponentProps) {
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
        <Link to="/projects" className="btn-primary mt-8">
          Back to projects
        </Link>
      </div>
    </PageShell>
  )
}
