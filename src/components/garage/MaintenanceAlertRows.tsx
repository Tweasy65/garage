import { AlertTriangle, CheckCircle2, Clock3, Info } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import type { MaintenanceAlert } from '@/lib/maintenanceAlerts'

const alertIcon = {
  overdue: AlertTriangle,
  'due-soon': Clock3,
  missing: Info,
}

const alertClass = {
  overdue: 'text-red-300',
  'due-soon': 'text-amber-300',
  missing: 'text-garage-muted',
}

type MaintenanceAlertRowsProps = {
  alerts: MaintenanceAlert[]
  emptyMessage?: string
  linkToVehicleService?: boolean
  onNavigate?: () => void
}

export default function MaintenanceAlertRows({
  alerts,
  emptyMessage = 'No alerts for this filter.',
  linkToVehicleService = false,
  onNavigate,
}: MaintenanceAlertRowsProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-garage-muted">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
        {emptyMessage}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-garage-border border border-garage-border">
      {alerts.map((alert) => {
        const Icon = alertIcon[alert.severity]
        const content = (
          <>
            <Icon
              className={`mt-0.5 size-4 shrink-0 ${alertClass[alert.severity]}`}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">{alert.title}</p>
              <p className="mt-0.5 text-sm text-garage-muted">
                {alert.vehicleLabel} · {alert.detail}
              </p>
            </div>
            <span
              className={`ml-auto shrink-0 text-[11px] font-semibold uppercase tracking-wider ${alertClass[alert.severity]}`}
            >
              {alert.severity.replace('-', ' ')}
            </span>
          </>
        )

        if (linkToVehicleService) {
          return (
            <li key={alert.id}>
              <Link
                to="/vehicles/$vehicleId"
                params={{ vehicleId: alert.vehicleId }}
                search={{ tab: 'service' }}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                onClick={onNavigate}
              >
                {content}
              </Link>
            </li>
          )
        }

        return (
          <li key={alert.id}>
            <div className="flex w-full items-start gap-3 px-4 py-3 text-left">
              {content}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
