import { Show } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

import ProjectsPage from '@/components/garage/ProjectsPage'
import SignInLanding from '@/components/garage/SignInLanding'
import { listProjectBoards } from '@/server/projectItems'

export const Route = createFileRoute('/projects')({
  loader: () => listProjectBoards(),
  component: ProjectsRoute,
})

function ProjectsRoute() {
  const { boards } = Route.useLoaderData()
  return (
    <>
      <Show when="signed-in">
        <ProjectsPage boards={boards} />
      </Show>
      <Show when="signed-out">
        <SignInLanding />
      </Show>
    </>
  )
}
