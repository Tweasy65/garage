import { Box, Star } from 'lucide-react'

import VehicleThumb from '@/components/garage/VehicleThumb'
import type { VehicleAsset } from '@/lib/vehicleTypes'

type VehicleAssetGalleryProps = {
  assets: VehicleAsset[]
  imageUrl: string | null
  modelAssetId: string | null
  title: string
}

export default function VehicleAssetGallery({
  assets,
  imageUrl,
  modelAssetId,
  title,
}: VehicleAssetGalleryProps) {
  const images = assets.filter((asset) => asset.kind === 'image')
  const model = assets.find((asset) => asset.kind === 'model' && asset.id === modelAssetId)

  if (images.length === 0 && !model) {
    return (
      <p className="text-sm text-garage-muted">
        No photos or 3D assets yet. Edit the vehicle to add media.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {images.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((asset) => {
            const isCover = asset.src === imageUrl
            return (
              <figure
                key={asset.id}
                className="group overflow-hidden rounded-sm border border-garage-border bg-garage-panel-2"
              >
                <VehicleThumb
                  src={asset.src}
                  alt={asset.name}
                  className="aspect-[4/3] w-full transition group-hover:opacity-95"
                  iconClassName="size-8"
                />
                <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-garage-muted">
                  <span className="truncate">{asset.name}</span>
                  {isCover ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-garage-text">
                      <Star className="size-3 fill-garage-accent text-garage-accent" />
                      Cover
                    </span>
                  ) : null}
                </figcaption>
              </figure>
            )
          })}
        </div>
      ) : null}

      {model ? (
        <div className="flex items-start gap-3 rounded-sm border border-garage-border bg-garage-panel-2 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-garage-border bg-garage-panel">
            <Box className="size-4 text-garage-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{model.name}</p>
            <p className="mt-1 text-xs text-garage-muted">
              Used in the {title} 3D viewer
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
