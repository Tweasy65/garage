export function formatDate(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatMoney(cents?: number | null): string | null {
  if (cents == null) return null
  return (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  })
}

export function formatMiles(value?: number | null): string {
  if (value == null) return '—'
  return `${value.toLocaleString()} mi`
}
