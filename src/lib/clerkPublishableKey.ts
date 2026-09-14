import { workerEnv } from '@/lib/workerEnv'

export function getClerkPublishableKey(): string | undefined {
  const fromVite = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (typeof fromVite === 'string' && fromVite.length > 0) {
    return fromVite
  }
  if (import.meta.env.SSR) {
    return (
      workerEnv('CLERK_PUBLISHABLE_KEY') ??
      workerEnv('VITE_CLERK_PUBLISHABLE_KEY')
    )
  }
  return undefined
}
