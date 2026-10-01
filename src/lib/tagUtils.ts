export function normalizeTagKey(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function resolveTagLabel(input: string, knownTags: string[]): string {
  const trimmed = input.trim().replace(/\s+/g, ' ')
  if (!trimmed) return ''
  const key = normalizeTagKey(trimmed)
  const match = knownTags.find((tag) => normalizeTagKey(tag) === key)
  return match ?? trimmed
}

export function tagAlreadySelected(tag: string, selected: string[]): boolean {
  const key = normalizeTagKey(tag)
  return selected.some((item) => normalizeTagKey(item) === key)
}

export function mergeTagLists(...lists: string[][]): string[] {
  const map = new Map<string, string>()
  for (const list of lists) {
    for (const tag of list) {
      const trimmed = tag.trim()
      if (!trimmed) continue
      const key = normalizeTagKey(trimmed)
      if (!map.has(key)) map.set(key, trimmed)
    }
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}
