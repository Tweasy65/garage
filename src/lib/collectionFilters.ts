import type { VehicleSummary } from '@/lib/vehicleTypes'

export type CollectionFilters = {
  query: string
  favorite: boolean
  project: boolean
  tag?: string
}

export function filterVehicles(
  vehicles: VehicleSummary[],
  filters: CollectionFilters,
): VehicleSummary[] {
  const query = filters.query.trim().toLowerCase()
  const tag = filters.tag?.trim().toLowerCase()

  return vehicles.filter((vehicle) => {
    if (filters.favorite && !vehicle.isFavorite) return false
    if (filters.project && !vehicle.isProject) return false
    if (tag && !vehicle.tags.some((item) => item.toLowerCase() === tag)) {
      return false
    }
    if (!query) return true
    const haystack = [
      vehicle.year,
      vehicle.make,
      vehicle.model,
      vehicle.trim,
      vehicle.color,
      ...vehicle.tags,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })
}

export function uniqueVehicleTags(vehicles: VehicleSummary[]): string[] {
  const tags = new Set<string>()
  for (const vehicle of vehicles) {
    for (const tag of vehicle.tags) {
      const next = tag.trim()
      if (next) tags.add(next)
    }
  }
  return [...tags].sort((a, b) => a.localeCompare(b))
}
