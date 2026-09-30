import { Show } from '@clerk/tanstack-react-start'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import CollectionPage from '@/components/garage/CollectionPage'
import SignInLanding from '@/components/garage/SignInLanding'
import { listVehicles } from '@/server/vehicles'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): { add?: boolean } => ({
    add:
      search.add === true || search.add === '1' || search.add === 'true'
        ? true
        : undefined,
  }),
  loader: () => listVehicles(),
  component: HomePage,
})

function HomePage() {
  const { vehicles, alerts } = Route.useLoaderData()
  const { add } = Route.useSearch()
  const navigate = useNavigate({ from: '/' })

  return (
    <>
      <Show when="signed-in">
        <CollectionPage
          vehicles={vehicles}
          alerts={alerts}
          addOpen={Boolean(add)}
          onOpenAdd={() => void navigate({ search: { add: true } })}
          onCloseAdd={() => void navigate({ search: {}, replace: true })}
        />
      </Show>
      <Show when="signed-out">
        <SignInLanding />
      </Show>
    </>
  )
}
