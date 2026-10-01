import { Box, Image, Search, Star, Upload, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { StockImage, VehicleAsset } from '@/lib/vehicleTypes'
import {
  VEHICLE_MODELS,
  catalogModelLabel,
  catalogModelToAsset,
  modelForVehicle,
  type VehicleModelSpec,
} from '@/data/vehicleModels'
import { searchStockImages } from '@/server/images'

const MAX_IMAGES = 12
const MAX_MODELS = 3
const MAX_MODEL_BYTES = 8 * 1024 * 1024

type VehicleAssetsFieldProps = {
  year: number
  make: string
  model: string
  bodyStyle?: string | null
  assets: VehicleAsset[]
  imageUrl: string | null
  modelAssetId: string | null
  onChange: (next: {
    assets: VehicleAsset[]
    imageUrl: string | null
    modelAssetId: string | null
  }) => void
}

async function imageFileToDataUrl(file: File): Promise<string> {
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

function createAsset(
  kind: VehicleAsset['kind'],
  name: string,
  mime: string,
  src: string,
): VehicleAsset {
  return {
    id: crypto.randomUUID(),
    kind,
    name: name.replace(/\.[^.]+$/, '') || name,
    mime,
    src,
    createdAt: new Date().toISOString(),
  }
}

export default function VehicleAssetsField({
  year,
  make,
  model,
  bodyStyle,
  assets,
  imageUrl,
  modelAssetId,
  onChange,
}: VehicleAssetsFieldProps) {
  const suggested = [year, make, model].filter(Boolean).join(' ')
  const [query, setQuery] = useState(suggested)
  const [stock, setStock] = useState<StockImage[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const images = assets.filter((asset) => asset.kind === 'image')
  const models = assets.filter((asset) => asset.kind === 'model')
  const vehicleMatch = { year, make, model, bodyStyle: bodyStyle ?? null }
  const matchedCatalog = modelForVehicle(vehicleMatch)

  function attachCatalogModel(spec: VehicleModelSpec) {
    const existing = assets.find((asset) => asset.id === spec.id && asset.kind === 'model')
    if (!existing && models.length >= MAX_MODELS) {
      setError(`You can add up to ${MAX_MODELS} 3D models.`)
      return
    }
    const nextAssets = existing ? assets : [...assets, catalogModelToAsset(spec)]
    emit(nextAssets, imageUrl, spec.id)
    setError(null)
  }

  useEffect(() => {
    setQuery(suggested)
  }, [suggested])

  function emit(
    nextAssets: VehicleAsset[],
    cover = imageUrl,
    viewerId = modelAssetId,
  ) {
    const nextImages = nextAssets.filter((asset) => asset.kind === 'image')
    const nextModels = nextAssets.filter((asset) => asset.kind === 'model')
    const nextCover =
      cover && nextImages.some((asset) => asset.src === cover)
        ? cover
        : (nextImages[0]?.src ?? null)
    const nextViewer =
      viewerId && nextModels.some((asset) => asset.id === viewerId)
        ? viewerId
        : (nextModels[0]?.id ?? null)
    onChange({
      assets: nextAssets,
      imageUrl: nextCover,
      modelAssetId: nextViewer,
    })
  }

  async function runSearch() {
    setSearching(true)
    setError(null)
    try {
      const { images: next } = await searchStockImages({
        data: { query: query || suggested },
      })
      setStock(next)
      if (next.length === 0) setError('No stock photos found. Try a simpler query.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (files.length === 0) return
    const room = MAX_IMAGES - images.length
    if (room <= 0) {
      setError(`You can add up to ${MAX_IMAGES} photos.`)
      return
    }
    try {
      const added: VehicleAsset[] = []
      for (const file of files.slice(0, room)) {
        added.push(
          createAsset('image', file.name, 'image/jpeg', await imageFileToDataUrl(file)),
        )
      }
      emit([...assets, ...added])
      setError(null)
    } catch {
      setError('Could not read that image')
    }
  }

  async function handleModelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (models.length >= MAX_MODELS) {
      setError(`You can add up to ${MAX_MODELS} 3D models.`)
      return
    }
    if (file.size > MAX_MODEL_BYTES) {
      setError('3D models need to be 8 MB or smaller.')
      return
    }
    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.glb') && !lower.endsWith('.gltf')) {
      setError('Use a .glb or .gltf file for the viewer.')
      return
    }
    try {
      const asset = createAsset(
        'model',
        file.name,
        file.type || (lower.endsWith('.gltf') ? 'model/gltf+json' : 'model/gltf-binary'),
        await fileToDataUrl(file),
      )
      emit([...assets, asset], imageUrl, modelAssetId ?? asset.id)
      setError(null)
    } catch {
      setError('Could not read that model')
    }
  }

  function addStockImage(image: StockImage) {
    if (images.some((asset) => asset.src === image.url)) {
      const existing = images.find((asset) => asset.src === image.url)
      if (existing) emit(assets, existing.src)
      return
    }
    if (images.length >= MAX_IMAGES) {
      setError(`You can add up to ${MAX_IMAGES} photos.`)
      return
    }
    emit([...assets, createAsset('image', image.title || 'Stock photo', 'image/*', image.url)])
    setError(null)
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <p className="label-caps">Photos</p>
          <p className="mt-1 text-sm text-garage-muted">
            Upload shots of the car or pick a stock image. One photo is the cover used in lists and cards.
          </p>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {images.map((asset) => {
              const isCover = imageUrl === asset.src
              return (
                <div
                  key={asset.id}
                  className={`relative overflow-hidden rounded-sm border ${
                    isCover ? 'border-garage-accent' : 'border-garage-border'
                  }`}
                >
                  <img src={asset.src} alt="" className="h-28 w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/70 px-2 py-1.5">
                    {isCover ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-garage-text">
                        <Star className="size-3 fill-garage-accent text-garage-accent" />
                        Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="text-[10px] font-semibold uppercase tracking-wider text-garage-muted hover:text-garage-text"
                        onClick={() => emit(assets, asset.src)}
                      >
                        Set as cover
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-garage-muted hover:text-garage-text"
                      aria-label="Remove photo"
                      onClick={() => emit(assets.filter((item) => item.id !== asset.id))}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center rounded-sm border border-dashed border-garage-border text-sm text-garage-muted">
            <span className="inline-flex items-center gap-2">
              <Image className="size-4" />
              No photos yet
            </span>
          </div>
        )}

        <label className="btn w-fit cursor-pointer">
          <Upload className="size-4" />
          Upload photos
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void handleImageUpload(e)}
          />
        </label>

        <div className="flex gap-2">
          <input
            className="field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stock photos"
          />
          <button
            type="button"
            className="btn shrink-0"
            disabled={searching}
            onClick={() => void runSearch()}
          >
            <Search className="size-4" />
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>
        {stock.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {stock.map((image) => (
              <button
                key={image.url}
                type="button"
                onClick={() => addStockImage(image)}
                className={`overflow-hidden rounded-sm border ${
                  images.some((asset) => asset.src === image.url)
                    ? 'border-garage-accent'
                    : 'border-garage-border'
                }`}
              >
                <img src={image.thumbUrl} alt={image.title} className="h-20 w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <p className="label-caps">3D models</p>
          <p className="mt-1 text-sm text-garage-muted">
            Pick a built-in garage model, upload your own .glb/.gltf, or choose which model powers the viewer.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-garage-muted">Garage library</p>
          <ul className="space-y-2">
            {VEHICLE_MODELS.map((spec) => {
              const attached = assets.some(
                (asset) => asset.id === spec.id && asset.kind === 'model',
              )
              const active = modelAssetId === spec.id
              const matchesVehicle = matchedCatalog?.id === spec.id
              return (
                <li
                  key={spec.id}
                  className={`flex items-center justify-between gap-3 border px-3 py-2 ${
                    active ? 'border-garage-accent bg-white/5' : 'border-garage-border'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{catalogModelLabel(spec)}</p>
                    <p className="text-xs text-garage-muted">
                      Built-in · {spec.src.replace(/^\/models\//, '')}
                      {matchesVehicle ? ' · Matches this vehicle' : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {active ? (
                      <span className="badge">Viewer</span>
                    ) : attached ? (
                      <button
                        type="button"
                        className="text-xs text-garage-muted hover:text-garage-text"
                        onClick={() => emit(assets, imageUrl, spec.id)}
                      >
                        Use in viewer
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-xs text-garage-muted hover:text-garage-text"
                        onClick={() => attachCatalogModel(spec)}
                      >
                        Add to vehicle
                      </button>
                    )}
                    {attached ? (
                      <button
                        type="button"
                        className="text-garage-muted hover:text-garage-text"
                        aria-label="Remove from vehicle"
                        onClick={() => emit(assets.filter((item) => item.id !== spec.id))}
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {models.filter((asset) => !VEHICLE_MODELS.some((spec) => spec.id === asset.id)).length >
        0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-garage-muted">Your uploads</p>
            <ul className="space-y-2">
              {models
                .filter((asset) => !VEHICLE_MODELS.some((spec) => spec.id === asset.id))
                .map((asset) => {
                  const active = modelAssetId === asset.id
                  return (
                    <li
                      key={asset.id}
                      className={`flex items-center justify-between gap-3 border px-3 py-2 ${
                        active ? 'border-garage-accent bg-white/5' : 'border-garage-border'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{asset.name}</p>
                        <p className="text-xs text-garage-muted">
                          {active ? 'Used in viewer' : asset.mime || 'Upload'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {active ? (
                          <span className="badge">Viewer</span>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-garage-muted hover:text-garage-text"
                            onClick={() => emit(assets, imageUrl, asset.id)}
                          >
                            Use in viewer
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-garage-muted hover:text-garage-text"
                          aria-label="Remove model"
                          onClick={() => emit(assets.filter((item) => item.id !== asset.id))}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  )
                })}
            </ul>
          </div>
        ) : models.length === 0 ? (
          <div className="flex h-20 items-center justify-center rounded-sm border border-dashed border-garage-border text-sm text-garage-muted">
            <span className="inline-flex items-center gap-2">
              <Box className="size-4" />
              No custom uploads yet
            </span>
          </div>
        ) : null}

        <label className="btn w-fit cursor-pointer">
          <Upload className="size-4" />
          Upload 3D model
          <input
            type="file"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            className="hidden"
            onChange={(e) => void handleModelUpload(e)}
          />
        </label>
      </section>

      {error ? <p className="text-sm text-garage-muted">{error}</p> : null}
    </div>
  )
}
