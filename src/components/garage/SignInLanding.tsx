import { SignInButton } from '@clerk/tanstack-react-start'
import { CarFront } from 'lucide-react'

export default function SignInLanding() {
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
      <SignInButton mode="modal">
        <button type="button" className="btn-primary mt-10">
          Sign in
        </button>
      </SignInButton>
    </div>
  )
}
