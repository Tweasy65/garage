import { useEffect, useState } from 'react'

export type ProjectListLayout = 'category' | 'list'

const STORAGE_KEY = 'garage-project-list-layout'

export function parseProjectListLayout(value: unknown): ProjectListLayout {
  return value === 'list' ? 'list' : 'category'
}

export function useProjectListLayout() {
  const [layout, setLayout] = useState<ProjectListLayout>('category')

  useEffect(() => {
    setLayout(parseProjectListLayout(window.localStorage.getItem(STORAGE_KEY)))
  }, [])

  function update(next: ProjectListLayout) {
    setLayout(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  return [layout, update] as const
}

export default function ProjectListLayoutToggle({
  value,
  onChange,
}: {
  value: ProjectListLayout
  onChange: (value: ProjectListLayout) => void
}) {
  return (
    <div
      className="flex rounded-sm border border-garage-border p-0.5"
      role="group"
      aria-label="Sort project items"
    >
      <button
        type="button"
        className={`segment-tab px-2.5 py-1 text-xs ${
          value === 'category' ? 'segment-tab-active' : ''
        }`}
        aria-pressed={value === 'category'}
        onClick={() => onChange('category')}
      >
        Category
      </button>
      <button
        type="button"
        className={`segment-tab px-2.5 py-1 text-xs ${
          value === 'list' ? 'segment-tab-active' : ''
        }`}
        aria-pressed={value === 'list'}
        onClick={() => onChange('list')}
      >
        List
      </button>
    </div>
  )
}
