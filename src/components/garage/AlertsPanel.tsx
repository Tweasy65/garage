import { AlertTriangle, Clock3, Info } from 'lucide-react'

import type { MaintenanceAlert } from '@/lib/maintenanceAlerts'

type AlertsPanelProps = {
  alerts: MaintenanceAlert[]
  onSelect: (vehicleId: string) => void
}

const icon = {
  overdue: AlertTriangle,
  'due-soon': Clock3,
  missing: Info,
}

export default function AlertsPanel({ alerts, onSelect }: AlertsPanelProps) {
  return (
    <section className="garage-panel">
      <div className="border-b border-garage-border px-4 py-3">
        <p className="label-caps">Service</p>
        <h2 className="mt-1 text-lg font-semibold">Alerts</h2>
      </div>
      {alerts.length === 0 ? (
        <p className="px-4 py-6 text-sm text-garage-muted">
          No upcoming maintenance. Keep odometer readings current as you log
          service.
        </p>
      ) : (
        <ul className="divide-y divide-garage-border">
          {alerts.map((alert) => {
            const Icon = icon[alert.severity]
            return (
              <li key={alert.id}>
                <button
                  type="button"
                  onClick={() => onSelect(alert.vehicleId)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/5"
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-garage-accent" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="mt-0.5 text-sm text-garage-muted">
                      {alert.vehicleLabel} · {alert.detail}
                    </p>
                  </div>
                  <span className="ml-auto shrink-0 text-[11px] font-semibold uppercase tracking-wider text-garage-muted">
                    {alert.severity.replace('-', ' ')}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
