import { ClerkProvider } from '@clerk/tanstack-react-start'

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
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  )
}
