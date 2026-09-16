import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef } from 'react'

import type { VehicleSummary } from '@/lib/vehicleTypes'

type CollectionCarouselProps = {
  vehicles: VehicleSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function CollectionCarousel({
  vehicles,
  selectedId,
  onSelect,
}: CollectionCarouselProps) {
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedId || !scroller.current) return
    const card = scroller.current.querySelector(`[data-vehicle-id="${selectedId}"]`)
    if (card instanceof HTMLElement) {
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedId])

  function scrollByCard(direction: -1 | 1) {
    const node = scroller.current
    if (!node) return
    node.scrollBy({ left: direction * (node.clientWidth * 0.72), behavior: 'smooth' })
  }

  if (vehicles.length === 0) return null

  return (
    <section className="garage-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-garage-border px-4 py-3">
        <div>
          <p className="label-caps">Collection</p>
          <h2 className="mt-1 text-lg font-semibold">Showcase</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={() => scrollByCard(-1)} aria-label="Previous">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" className="btn" onClick={() => scrollByCard(1)} aria-label="Next">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto p-4 scroll-smooth"
      >
        {vehicles.map((vehicle) => (
          <button
            key={vehicle.id}
            type="button"
            data-vehicle-id={vehicle.id}
            onClick={() => onSelect(vehicle.id)}
            className={`w-[min(100%,420px)] shrink-0 snap-center overflow-hidden rounded-sm border text-left transition ${
              selectedId === vehicle.id
                ? 'border-garage-accent'
                : 'border-garage-border hover:border-garage-muted'
            }`}
          >
            <div className="h-48 bg-garage-panel-2">
              {vehicle.imageUrl ? (
                <img
                  src={vehicle.imageUrl}
                  alt=""
                  className="h-full w-full object-cover grayscale"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-garage-muted">
                  No photo
                </div>
              )}
            </div>
            <div className="border-t border-garage-border bg-garage-panel px-4 py-3">
              <p className="truncate font-medium">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              <p className="mt-1 text-sm text-garage-muted">
                {vehicle.mileage.toLocaleString()} mi
                {vehicle.trim ? ` · ${vehicle.trim}` : ''}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
