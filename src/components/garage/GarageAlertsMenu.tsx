import { Bell } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useEffect, useId, useRef, useState } from 'react'

import MaintenanceAlertRows from '@/components/garage/MaintenanceAlertRows'
import { useGarageAlerts } from '@/components/garage/garageAlertsContext'

function formatBadgeCount(count: number) {
  if (count > 9) return '9+'
  return String(count)
}

export default function GarageAlertsMenu() {
  const panelId = useId()
  const { alerts, openCount } = useGarageAlerts()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="garage-alerts-menu relative">
      <button
        type="button"
        className="relative flex size-9 items-center justify-center border border-garage-border bg-garage-panel-2 text-garage-muted transition hover:text-garage-text"
        aria-label={
          openCount > 0
            ? `${openCount} maintenance alerts`
            : 'Maintenance alerts'
        }
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-4" />
        {openCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-sm bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
            {formatBadgeCount(openCount)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Maintenance alerts"
          className="garage-alerts-menu-panel absolute right-0 top-full z-40 mt-2 w-[min(100vw-2rem,22rem)]"
        >
          <div className="border border-garage-border bg-garage-panel p-3 shadow-lg">
            <div className="flex items-center justify-between gap-2 border-b border-garage-border pb-2">
              <p className="label-caps">Alerts</p>
              {openCount > 0 ? (
                <span className="text-xs tabular-nums text-garage-muted">
                  {openCount}
                </span>
              ) : null}
            </div>
            <div className="garage-alerts-menu-scroll mt-3">
              <MaintenanceAlertRows
                alerts={alerts}
                linkToVehicleService
                onNavigate={() => setOpen(false)}
                emptyMessage="Nothing due — service looks current."
              />
            </div>
            <div className="mt-3 border-t border-garage-border pt-2">
              <Link
                to="/service"
                className="text-xs text-garage-muted underline hover:text-garage-text"
                onClick={() => setOpen(false)}
              >
                View service history
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
