import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'

import { getClerkPublishableKey } from '@/lib/clerkPublishableKey'
import { workerEnv } from '@/lib/workerEnv'

export const startInstance = createStart(() => ({
  requestMiddleware: [
    clerkMiddleware(() => {
      const secretKey = workerEnv('CLERK_SECRET_KEY')
      const publishableKey = getClerkPublishableKey()
      return {
        ...(secretKey ? { secretKey } : {}),
        ...(publishableKey ? { publishableKey } : {}),
      }
    }),
  ],
}))
