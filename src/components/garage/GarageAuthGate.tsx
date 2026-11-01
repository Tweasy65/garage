import { Show } from '@clerk/tanstack-react-start'
import type { ReactNode } from 'react'

import SignInLanding from '@/components/garage/SignInLanding'

export default function GarageAuthGate({ children }: { children: ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <SignInLanding />
      </Show>
    </>
  )
}
