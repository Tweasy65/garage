import type { VehicleDetail } from '@/lib/vehicleTypes'

import VehicleAssetGallery from '@/components/garage/VehicleAssetGallery'

type VehicleMediaTabProps = {
  vehicle: VehicleDetail
  onEdit: () => void
}

export default function VehicleMediaTab({ vehicle, onEdit }: VehicleMediaTabProps) {
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const hasMedia =
    vehicle.assets.some((a) => a.kind === 'image') || Boolean(vehicle.modelAssetId)

  return (
    <div role="tabpanel" id="vehicle-tab-media" aria-labelledby="tab-media">
      <div className="section-header">
        <div>
          <p className="label-caps">Media</p>
          <h2 className="mt-1 text-base font-semibold">Photos & models</h2>
        </div>
        <button type="button" className="btn px-3 text-xs" onClick={onEdit}>
          Manage media
        </button>
      </div>

      <div className="section-body">
        {hasMedia ? (
          <VehicleAssetGallery
            assets={vehicle.assets}
            imageUrl={vehicle.imageUrl}
            modelAssetId={vehicle.modelAssetId}
            title={title}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-garage-muted">
              Add stock photos, uploads, or a 3D model for this vehicle.
            </p>
            <button type="button" className="btn-primary text-xs" onClick={onEdit}>
              Add photos
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
