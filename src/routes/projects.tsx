import { createFileRoute } from '@tanstack/react-router'

import GarageAuthGate from '@/components/garage/GarageAuthGate'
import ProjectsPage from '@/components/garage/ProjectsPage'
import { listProjectBoards } from '@/server/projectItems'

export const Route = createFileRoute('/projects')({
  loader: () => listProjectBoards(),
  component: ProjectsRoute,
})

function ProjectsRoute() {
  const { boards } = Route.useLoaderData()
  return (
    <GarageAuthGate>
      <ProjectsPage boards={boards} />
    </GarageAuthGate>
  )
}
