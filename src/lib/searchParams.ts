export function parseTruthyFlag(value: unknown): true | undefined {
  if (value === true || value === '1' || value === 'true') return true
  return undefined
}
