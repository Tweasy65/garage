import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import VehicleModelCanvas from '@/components/garage/VehicleModelCanvas'
import VehicleThumb from '@/components/garage/VehicleThumb'
import {
  FEATURED_MODEL,
  paintColorFromName,
  specForVehicle,
} from '@/data/vehicleModels'
import { formatMiles } from '@/lib/format'
import type { VehicleDetail, VehicleSummary } from '@/lib/vehicleTypes'

type CollectionCarouselProps = {
  vehicles: VehicleSummary[]
  selectedId: string | null
  selectedDetail?: VehicleDetail | null
  onSelect: (id: string) => void
}

export default function CollectionCarousel({
  vehicles,
  selectedId,
  selectedDetail,
  onSelect,
}: CollectionCarouselProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const selectedSummary =
    vehicles.find((vehicle) => vehicle.id === selectedId) ?? vehicles[0]
  const selected =
    selectedDetail?.id === selectedSummary?.id ? selectedDetail : selectedSummary
  const matched = selected ? specForVehicle(selected) : null
  const spec = matched ?? FEATURED_MODEL
  const [hoodOpen, setHoodOpen] = useState(false)
  const [trunkOpen, setTrunkOpen] = useState(false)

  useEffect(() => {
    setHoodOpen(false)
    setTrunkOpen(false)
  }, [selected?.id])

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

  return (
    <section className="garage-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-garage-border px-4 py-3">
        <div>
          <p className="label-caps">Collection</p>
          <h2 className="mt-1 text-lg font-semibold">Showcase</h2>
        </div>
        <div className="flex gap-2">
          {selectedId ? (
            <Link
              to="/vehicles/$vehicleId"
              params={{ vehicleId: selectedId }}
              className="btn px-3 text-xs"
            >
              View vehicle
            </Link>
          ) : null}
          <button
            type="button"
            className={`btn px-3 text-xs ${hoodOpen ? 'border-garage-accent bg-white/10' : ''}`}
            onClick={() => setHoodOpen((open) => !open)}
          >
            Hood
          </button>
          <button
            type="button"
            className={`btn px-3 text-xs ${trunkOpen ? 'border-garage-accent bg-white/10' : ''}`}
            onClick={() => setTrunkOpen((open) => !open)}
          >
            Trunk
          </button>
          {vehicles.length > 1 ? (
            <>
              <button type="button" className="btn px-2" onClick={() => scrollByCard(-1)} aria-label="Previous">
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" className="btn px-2" onClick={() => scrollByCard(1)} aria-label="Next">
                <ChevronRight className="size-4" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <VehicleModelCanvas
        spec={spec}
        color={matched ? paintColorFromName(selected?.color) : paintColorFromName('red')}
        pose={{ hoodOpen, trunkOpen }}
        className="h-72 w-full md:h-80"
      />

      <div className="border-t border-garage-border px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">
            {spec.year} {spec.make} {spec.model}
            {spec.bodyStyle ? ` ${spec.bodyStyle}` : ''}
          </p>
          <span className="badge">3D</span>
          {selected?.isFavorite && matched ? (
            <Star className="size-3 shrink-0 fill-garage-accent text-garage-accent" />
          ) : null}
        </div>
        <p className="mt-1 text-sm text-garage-muted">
          {matched && selected
            ? `${formatMiles(selected.mileage)}${selected.trim ? ` · ${selected.trim}` : ''}${selected.isProject ? ' · Project' : ''} · Drag to orbit`
            : 'Featured model · Drag to orbit · Zoom with the controls'}
        </p>
      </div>

      {vehicles.length > 1 ? (
        <div
          ref={scroller}
          className="hide-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto border-t border-garage-border p-3"
        >
          {vehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              type="button"
              data-vehicle-id={vehicle.id}
              onClick={() => onSelect(vehicle.id)}
              className={`w-28 shrink-0 snap-start overflow-hidden rounded-sm border text-left ${
                selectedId === vehicle.id
                  ? 'border-garage-accent'
                  : 'border-garage-border hover:border-garage-muted'
              }`}
            >
              <VehicleThumb
                src={vehicle.imageUrl}
                alt=""
                className="h-16"
                iconClassName="size-5"
              />
              <p className="truncate px-2 py-1.5 text-[11px] text-garage-muted">
                {vehicle.year} {vehicle.make}
              </p>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
