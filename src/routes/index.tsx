import { createFileRoute, useNavigate } from '@tanstack/react-router'

import CollectionPage from '@/components/garage/CollectionPage'
import GarageAuthGate from '@/components/garage/GarageAuthGate'
import type { CollectionFilters } from '@/lib/collectionFilters'
import { parseTruthyFlag } from '@/lib/searchParams'
import { listVehicles } from '@/server/vehicles'

export type CollectionSearch = {
  add?: boolean
  q?: string
  tag?: string
  favorite?: boolean
  project?: boolean
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): CollectionSearch => ({
    add: parseTruthyFlag(search.add),
    q: typeof search.q === 'string' && search.q.trim() ? search.q : undefined,
    tag:
      typeof search.tag === 'string' && search.tag.trim()
        ? search.tag.trim()
        : undefined,
    favorite: parseTruthyFlag(search.favorite),
    project: parseTruthyFlag(search.project),
  }),
  loader: () => listVehicles(),
  component: HomePage,
})

function HomePage() {
  const { vehicles, alerts } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/' })
  const filters: CollectionFilters = {
    query: search.q ?? '',
    favorite: Boolean(search.favorite),
    project: Boolean(search.project),
    tag: search.tag,
  }

  function setSearch(next: CollectionSearch) {
    void navigate({
      search: {
        add: next.add || undefined,
        q: next.q || undefined,
        tag: next.tag || undefined,
        favorite: next.favorite || undefined,
        project: next.project || undefined,
      },
      replace: true,
    })
  }

  return (
    <GarageAuthGate>
      <CollectionPage
        vehicles={vehicles}
        alerts={alerts}
        filters={filters}
        onFiltersChange={(next) =>
          setSearch({
            add: search.add,
            q: next.query,
            tag: next.tag,
            favorite: next.favorite || undefined,
            project: next.project || undefined,
          })
        }
        addOpen={Boolean(search.add)}
        onOpenAdd={() => setSearch({ ...search, add: true })}
        onCloseAdd={() => setSearch({ ...search, add: undefined })}
      />
    </GarageAuthGate>
  )
}
