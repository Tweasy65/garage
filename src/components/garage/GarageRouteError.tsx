import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

import PageShell from '@/components/garage/PageShell'
import SignInLanding from '@/components/garage/SignInLanding'

type GarageRouteErrorProps = ErrorComponentProps & {
  backTo: '/' | '/projects'
  backLabel: string
}

export default function GarageRouteError({
  error,
  backTo,
  backLabel,
}: GarageRouteErrorProps) {
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
        <Link to={backTo} className="btn-primary mt-8">
          {backLabel}
        </Link>
      </div>
    </PageShell>
  )
}
