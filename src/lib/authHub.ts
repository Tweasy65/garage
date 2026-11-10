/**
 * Garage signs in through the shared Barton Home auth hub, like every other bartonhome.dev app:
 * one Clerk application (clerk.bartonhome.dev), one session across subdomains, invite-only.
 * Local dev keeps Clerk's modal against the development instance, which has no hub.
 */
export const AUTH_HUB_URL = (import.meta.env.VITE_AUTH_HUB_URL as string | undefined)?.trim() || 'https://auth.bartonhome.dev'
export const HUB_URL = (import.meta.env.VITE_HUB_URL as string | undefined)?.trim() || 'https://bartonhome.dev'

/** Use the hub's pages only in production builds; dev signs in with the modal. */
export const usesAuthHub = !import.meta.env.DEV

/** The hub's sign-in page, returning to `returnTo` afterwards. */
export function signInUrl(returnTo: string) {
  return `${AUTH_HUB_URL}/sign-in?redirect_url=${encodeURIComponent(returnTo)}`
}
