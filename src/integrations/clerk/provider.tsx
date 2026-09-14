import { ClerkProvider } from '@clerk/tanstack-react-start'

import { getClerkPublishableKey } from '@/lib/clerkPublishableKey'

export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const publishableKey = getClerkPublishableKey()
  if (!publishableKey) {
    throw new Error(
      'Missing Clerk publishable key. Set VITE_CLERK_PUBLISHABLE_KEY in .env.local.',
    )
  }
  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      {children}
    </ClerkProvider>
  )
}
