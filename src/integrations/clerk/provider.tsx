import { ClerkProvider } from '@clerk/tanstack-react-start'

import { clerkAuthorizedParties } from '@/lib/clerkAuthorizedParties'
import { getClerkPublishableKey } from '@/lib/clerkPublishableKey'

export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const publishableKey = getClerkPublishableKey()
  return (
    <ClerkProvider
      {...(publishableKey ? { publishableKey } : {})}
      allowedRedirectOrigins={clerkAuthorizedParties()}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  )
}
