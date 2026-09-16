import { Search, Upload } from 'lucide-react'
import { useState } from 'react'

import type { StockImage } from '@/lib/vehicleTypes'
import { searchStockImages } from '@/server/images'

type VehicleImageFieldProps = {
  year: number
  make: string
  model: string
  value: string
  onChange: (url: string) => void
}

async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const max = 1280
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not read image')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

export default function VehicleImageField({
  year,
  make,
  model,
  value,
  onChange,
}: VehicleImageFieldProps) {
  const [query, setQuery] = useState(
    [year, make, model].filter(Boolean).join(' '),
  )
  const [images, setImages] = useState<StockImage[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    setError(null)
    try {
      const { images: next } = await searchStockImages({
        data: { query: query || `${year} ${make} ${model}` },
      })
      setImages(next)
      if (next.length === 0) setError('No stock photos found. Try a simpler query.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      onChange(await fileToDataUrl(file))
      setError(null)
    } catch {
      setError('Could not read that image')
    }
  }

  return (
    <div className="space-y-3">
      <p className="label-caps">Vehicle image</p>
      {value ? (
        <div className="h-40 overflow-hidden rounded-sm border border-garage-border bg-garage-panel-2">
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-sm border border-dashed border-garage-border text-sm text-garage-muted">
          No image selected
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <label className="btn cursor-pointer">
          <Upload className="size-4" />
          Upload photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </label>
      </div>

      <form onSubmit={runSearch} className="flex gap-2">
        <input
          className="field"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stock photos"
        />
        <button type="submit" className="btn shrink-0" disabled={searching}>
          <Search className="size-4" />
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error ? <p className="text-sm text-garage-muted">{error}</p> : null}
      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image) => (
            <button
              key={image.url}
              type="button"
              onClick={() => onChange(image.url)}
              className={`overflow-hidden rounded-sm border ${
                value === image.url ? 'border-garage-accent' : 'border-garage-border'
              }`}
            >
              <img src={image.thumbUrl} alt={image.title} className="h-20 w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
