import { useRouter } from '@tanstack/react-router'
import { Camera, Loader2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import VehicleModelCanvas from '@/components/garage/VehicleModelCanvas'
import { paintColorFromName, specFromAsset } from '@/data/vehicleModels'
import { resizeDataUrl } from '@/lib/imageDataUrl'
import type { VehicleAsset, VehicleDetail } from '@/lib/vehicleTypes'
import { addVehicleCoverFromModel } from '@/server/vehicles'

function uploadedModelAsset(vehicle: VehicleDetail): VehicleAsset | null {
  if (!vehicle.modelAssetId) return null
  const asset = vehicle.assets.find(
    (entry) => entry.id === vehicle.modelAssetId && entry.kind === 'model',
  )
  if (!asset) return null
  if (asset.src.startsWith('data:') || asset.src.startsWith('blob:')) return asset
  return null
}

type VehicleCoverFromModelProps = {
  vehicle: VehicleDetail
}

export default function VehicleCoverFromModel({ vehicle }: VehicleCoverFromModelProps) {
  const modelAsset = uploadedModelAsset(vehicle)
  const router = useRouter()
  const captureRef = useRef<(() => string) | null>(null)
  const [canCapture, setCanCapture] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onCaptureReady = useCallback((capture: (() => string) | null) => {
    captureRef.current = capture
    setCanCapture(Boolean(capture))
  }, [])

  if (!modelAsset) return null

  const spec = specFromAsset(vehicle, modelAsset)
  const color = paintColorFromName(vehicle.color)

  async function generateCover() {
    const capture = captureRef.current
    if (!capture) {
      setError('Wait for the model to finish loading.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const raw = capture()
      if (!raw) throw new Error('Could not capture the studio view')
      const dataUrl = await resizeDataUrl(raw)
      await addVehicleCoverFromModel({ data: { id: vehicle.id, dataUrl } })
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate cover')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="rounded-sm border border-garage-border bg-garage-panel-2/40 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Cover from 3D model</p>
          <p className="mt-1 text-sm text-garage-muted">
            Capture the current studio angle as a JPEG and set it as the list cover photo.
            Regenerating replaces the previous studio capture.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary shrink-0 text-xs"
          disabled={pending || !canCapture}
          onClick={() => void generateCover()}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Camera className="size-3.5" />
          )}
          Generate cover photo
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-sm border border-garage-border">
        <VehicleModelCanvas
          spec={spec}
          color={color}
          autoRotate={false}
          showControls={false}
          className="h-44 sm:h-52"
          onCaptureReady={onCaptureReady}
        />
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {!canCapture && !error ? (
        <p className="mt-3 text-xs text-garage-muted">Loading model for capture…</p>
      ) : null}
    </section>
  )
}
