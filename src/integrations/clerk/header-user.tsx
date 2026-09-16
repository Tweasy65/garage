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
        className="btn"
      >
        Sign in
      </button>
    </SignInButton>
  )
}
