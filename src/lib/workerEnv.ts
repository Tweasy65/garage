export function workerEnv(key: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    return undefined
  }
  const v = process.env[key]?.trim()
  return v || undefined
}
