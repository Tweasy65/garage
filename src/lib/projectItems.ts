import type { ProjectArea } from '@/db/schema'
import { PROJECT_AREAS } from '@/db/schema'
import type { ProjectItem } from '@/lib/vehicleTypes'

export { PROJECT_AREAS }
export type { ProjectArea }

export const PROJECT_AREA_LABELS: Record<ProjectArea, string> = {
  engine: 'Engine',
  body: 'Body',
  interior: 'Interior',
  electrical: 'Electrical',
  misc: 'Misc',
}

export function isProjectArea(value: unknown): value is ProjectArea {
  return (
    typeof value === 'string' &&
    (PROJECT_AREAS as readonly string[]).includes(value)
  )
}

export function parseProjectArea(value: unknown): ProjectArea {
  return isProjectArea(value) ? value : 'misc'
}

export function sortProjectItems(items: ProjectItem[]): ProjectItem[] {
  return [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.createdAt.localeCompare(b.createdAt)
  })
}

export function itemsForArea(
  items: ProjectItem[],
  area: ProjectArea,
): ProjectItem[] {
  return sortProjectItems(items.filter((item) => item.area === area))
}

export function openProjectCount(items: ProjectItem[]): number {
  return items.filter((item) => !item.done).length
}
