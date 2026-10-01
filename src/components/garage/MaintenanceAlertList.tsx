import { AlertTriangle, CheckCircle2, Clock3, Info } from 'lucide-react'

import type { MaintenanceAlert } from '@/lib/maintenanceAlerts'

const alertIcon = {
  overdue: AlertTriangle,
  'due-soon': Clock3,
  missing: Info,
}

const alertClass = {
  overdue: 'border-red-400/30 bg-red-400/5 text-red-200',
  'due-soon': 'border-amber-400/30 bg-amber-400/5 text-amber-200',
  missing: 'border-garage-border bg-garage-panel-2 text-garage-muted',
}

type MaintenanceAlertListProps = {
  alerts: MaintenanceAlert[]
  emptyMessage?: string
}

export default function MaintenanceAlertList({
  alerts,
  emptyMessage = 'Nothing due — service looks current for this vehicle.',
}: MaintenanceAlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-sm border border-garage-border bg-garage-panel-2/40 px-4 py-3 text-sm text-garage-muted">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
        {emptyMessage}
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert) => {
        const Icon = alertIcon[alert.severity]
        return (
          <li
            key={alert.id}
            className={`flex items-start gap-3 rounded-sm border px-4 py-3 text-sm ${alertClass[alert.severity]}`}
          >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium">{alert.title}</p>
              <p className="mt-0.5 text-garage-muted">{alert.detail}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
