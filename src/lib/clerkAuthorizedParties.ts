const PRODUCTION_PARTIES = [
  'https://garage.bartonhome.dev',
  'https://garage.tylerjamesbar.workers.dev',
] as const

function extraParties(): string[] {
  const raw = import.meta.env.VITE_CLERK_AUTHORIZED_PARTIES
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

export function clerkAuthorizedParties(): string[] {
  const extras = extraParties()
  if (import.meta.env.DEV) {
    return unique([
      ...PRODUCTION_PARTIES,
      'http://localhost:3089',
      'http://127.0.0.1:3089',
      ...extras,
    ])
  }
  return unique([...PRODUCTION_PARTIES, ...extras])
}
