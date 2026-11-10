import { ClerkProvider } from '@clerk/tanstack-react-start'

import { AUTH_HUB_URL, HUB_URL, usesAuthHub } from '@/lib/authHub'
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
      {...(usesAuthHub
        ? {
            signInUrl: `${AUTH_HUB_URL}/sign-in`,
            signUpUrl: `${AUTH_HUB_URL}/accept-invite`,
            afterSignOutUrl: HUB_URL,
          }
        : { afterSignOutUrl: '/' })}
    >
      {children}
    </ClerkProvider>
  )
}
