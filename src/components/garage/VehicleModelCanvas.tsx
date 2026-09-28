import { useEffect, useState, type ComponentProps } from 'react'

import type VehicleModelViewer from '@/components/garage/VehicleModelViewer'

type ViewerProps = ComponentProps<typeof VehicleModelViewer>

export default function VehicleModelCanvas(props: ViewerProps) {
  const [Viewer, setViewer] = useState<typeof VehicleModelViewer | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void import('./VehicleModelViewer')
      .then((module) => {
        if (active) setViewer(() => module.default)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load 3D viewer')
        }
      })
    return () => {
      active = false
    }
  }, [])

  if (error) {
    return (
      <div
        className={`flex h-72 items-center justify-center bg-[#141416] px-6 text-center text-sm text-garage-muted md:h-80 ${props.className ?? ''}`}
      >
        {error}
      </div>
    )
  }

  if (!Viewer) {
    return (
      <div
        className={`flex h-72 items-center justify-center bg-[#141416] text-sm text-garage-muted md:h-80 ${props.className ?? ''}`}
      >
        Loading 3D model…
      </div>
    )
  }

  return <Viewer {...props} />
}
