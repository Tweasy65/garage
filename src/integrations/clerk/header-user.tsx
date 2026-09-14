import { SignInButton, UserButton, useAuth } from '@clerk/tanstack-react-start'

export default function HeaderUser() {
  const { isLoaded, userId } = useAuth()
  if (!isLoaded) return null
  if (userId) {
    return (
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'size-9',
          },
        }}
      />
    )
  }
  return (
    <SignInButton mode="modal">
      <button
        type="button"
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
      >
        Sign in
      </button>
    </SignInButton>
  )
}
