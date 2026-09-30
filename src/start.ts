import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createCsrfMiddleware, createStart } from '@tanstack/react-start'

import { getClerkPublishableKey } from '@/lib/clerkPublishableKey'
import { workerEnv } from '@/lib/workerEnv'

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => ({
  requestMiddleware: [
    csrfMiddleware,
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
