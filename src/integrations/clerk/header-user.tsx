import { SignInButton, UserButton, useAuth } from '@clerk/tanstack-react-start'

import { signInUrl, usesAuthHub } from '@/lib/authHub'

const clerkAppearance = {
  variables: {
    colorBackground: '#1a1a1a',
    colorInputBackground: '#242424',
    colorInputText: '#f2f2f2',
    colorText: '#f2f2f2',
    colorTextSecondary: '#8a8a8a',
    colorNeutral: '#3a3a3a',
    colorPrimary: '#f2f2f2',
    borderRadius: '0.25rem',
  },
  elements: {
    avatarBox: 'size-9',
    userButtonPopoverCard: 'bg-garage-panel border border-garage-border',
  },
}

export default function HeaderUser() {
  const { isLoaded, userId } = useAuth()
  if (!isLoaded) {
    return <div className="size-9 rounded-sm border border-garage-border bg-garage-panel-2" />
  }
  if (userId) {
    return <UserButton appearance={clerkAppearance} />
  }
  if (usesAuthHub) {
    return (
      <a
        href={signInUrl(typeof window === 'undefined' ? 'https://garage.bartonhome.dev/' : window.location.href)}
        className="btn"
      >
        Sign in
      </a>
    )
  }
  return (
    <SignInButton mode="modal">
      <button type="button" className="btn">
        Sign in
      </button>
    </SignInButton>
  )
}
