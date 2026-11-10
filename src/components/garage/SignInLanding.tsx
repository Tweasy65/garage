import { SignInButton } from '@clerk/tanstack-react-start'
import { CarFront } from 'lucide-react'
import { useEffect, useState } from 'react'

import { signInUrl, usesAuthHub } from '@/lib/authHub'

/** Signed out: send people to the Barton Home sign-in (and back here after), with a button as a fallback. */
export default function SignInLanding() {
  const [href, setHref] = useState<string | null>(null)

  useEffect(() => {
    if (!usesAuthHub) return
    const target = signInUrl(window.location.href)
    setHref(target)
    window.location.replace(target)
  }, [])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className="flex size-16 items-center justify-center border border-garage-border bg-garage-panel-2"
        aria-hidden
      >
        <CarFront className="size-8 text-garage-accent" strokeWidth={1.5} />
      </div>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight md:text-4xl">
        Garage
      </h1>
      {usesAuthHub ? (
        <a href={href ?? '#'} className="btn-primary mt-10">
          Sign in with Barton Home
        </a>
      ) : (
        <SignInButton mode="modal">
          <button type="button" className="btn-primary mt-10">
            Sign in
          </button>
        </SignInButton>
      )}
    </div>
  )
}
