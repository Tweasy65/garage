import { CarFront } from 'lucide-react'

type VehicleThumbProps = {
  src?: string | null
  alt?: string
  className?: string
  iconClassName?: string
}

export default function VehicleThumb({
  src,
  alt = '',
  className = '',
  iconClassName = 'size-6',
}: VehicleThumbProps) {
  return (
    <div className={`overflow-hidden bg-garage-panel-2 ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-garage-muted">
          <CarFront className={`${iconClassName} opacity-40`} />
        </div>
      )}
    </div>
  )
}
