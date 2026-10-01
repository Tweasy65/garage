import { X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import {
  mergeTagLists,
  normalizeTagKey,
  resolveTagLabel,
  tagAlreadySelected,
} from '@/lib/tagUtils'
import { listGarageTags } from '@/server/vehicles'

type VehicleTagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
}

export default function VehicleTagInput({ value, onChange, disabled }: VehicleTagInputProps) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [garageTags, setGarageTags] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const knownTags = useMemo(
    () => mergeTagLists(garageTags, value),
    [garageTags, value],
  )

  useEffect(() => {
    let active = true
    void listGarageTags()
      .then(({ tags }) => {
        if (active) setGarageTags(tags)
      })
      .catch(() => {
        if (active) setGarageTags([])
      })
    return () => {
      active = false
    }
  }, [])

  const suggestions = useMemo(() => {
    const q = normalizeTagKey(query)
    const pool = knownTags.filter((tag) => !tagAlreadySelected(tag, value))
    if (!q) return pool.slice(0, 8)
    return pool
      .filter((tag) => normalizeTagKey(tag).includes(q))
      .slice(0, 8)
  }, [knownTags, query, value])

  const pendingLabel = query.trim() ? resolveTagLabel(query, knownTags) : ''
  const canCreate =
    pendingLabel.length > 0 &&
    !tagAlreadySelected(pendingLabel, value) &&
    !suggestions.some((tag) => normalizeTagKey(tag) === normalizeTagKey(pendingLabel))

  const optionCount = suggestions.length + (canCreate ? 1 : 0)

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  function addTag(raw: string) {
    const label = resolveTagLabel(raw, knownTags)
    if (!label || tagAlreadySelected(label, value)) return
    onChange([...value, label])
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  function removeTag(tag: string) {
    const key = normalizeTagKey(tag)
    onChange(value.filter((item) => normalizeTagKey(item) !== key))
  }

  function commitQuery() {
    if (!query.trim()) return
    addTag(query)
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !query && value.length > 0) {
      removeTag(value[value.length - 1])
      return
    }
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      if (open && optionCount > 0) {
        if (activeIndex < suggestions.length) {
          addTag(suggestions[activeIndex])
        } else if (canCreate) {
          addTag(query)
        }
      } else {
        commitQuery()
      }
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => (optionCount ? (index + 1) % optionCount : 0))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) =>
        optionCount ? (index - 1 + optionCount) % optionCount : 0,
      )
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <div
        className="field flex min-h-11 flex-wrap items-center gap-2 py-2"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span key={normalizeTagKey(tag)} className="badge inline-flex items-center gap-1">
            {tag}
            <button
              type="button"
              className="rounded-sm p-0.5 text-garage-muted hover:bg-white/10 hover:text-garage-text"
              aria-label={`Remove ${tag}`}
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation()
                removeTag(tag)
              }}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={listId}
          type="text"
          className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-garage-muted"
          value={query}
          disabled={disabled}
          placeholder={value.length === 0 ? 'Type a tag…' : 'Add another…'}
          aria-autocomplete="list"
          aria-expanded={open && optionCount > 0}
          aria-controls={`${listId}-listbox`}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              if (!query.trim()) setOpen(false)
            }, 120)
          }}
          onKeyDown={onInputKeyDown}
        />
      </div>

      {open && optionCount > 0 ? (
        <ul
          id={`${listId}-listbox`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-sm border border-garage-border bg-garage-panel py-1 shadow-lg"
        >
          {suggestions.map((tag, index) => (
            <li key={normalizeTagKey(tag)} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                className={`flex w-full px-3 py-2 text-left text-sm ${
                  activeIndex === index
                    ? 'bg-garage-panel-2 text-garage-text'
                    : 'text-garage-muted hover:bg-garage-panel-2/70 hover:text-garage-text'
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addTag(tag)}
              >
                {tag}
              </button>
            </li>
          ))}
          {canCreate ? (
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={activeIndex === suggestions.length}
                className={`flex w-full px-3 py-2 text-left text-sm ${
                  activeIndex === suggestions.length
                    ? 'bg-garage-panel-2 text-garage-text'
                    : 'text-garage-muted hover:bg-garage-panel-2/70 hover:text-garage-text'
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addTag(query)}
              >
                Create “{pendingLabel}”
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
      <p className="mt-1.5 text-xs text-garage-muted">
        Matches tags already used in your garage. Press Enter to add.
      </p>
    </div>
  )
}
