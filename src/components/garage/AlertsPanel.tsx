import { AlertTriangle, CheckCircle2, Clock3, Info } from 'lucide-react'

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

const severityClass = {
  overdue: 'text-red-300',
  'due-soon': 'text-amber-300',
  missing: 'text-garage-muted',
}

export default function AlertsPanel({ alerts, onSelect }: AlertsPanelProps) {
  const overdue = alerts.filter((alert) => alert.severity === 'overdue').length
  const dueSoon = alerts.filter((alert) => alert.severity === 'due-soon').length

  if (alerts.length === 0) {
    return (
      <section className="garage-panel flex items-center gap-3 px-4 py-3">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
        <div>
          <p className="text-sm font-medium">Service is current</p>
          <p className="text-xs text-garage-muted">
            Log mileage when you service a vehicle so intervals stay accurate.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="garage-panel">
      <div className="flex items-center justify-between border-b border-garage-border px-4 py-3">
        <div>
          <p className="label-caps">Service</p>
          <h2 className="mt-1 text-lg font-semibold">Alerts</h2>
        </div>
        <p className="text-xs text-garage-muted">
          {overdue ? `${overdue} overdue` : null}
          {overdue && dueSoon ? ' · ' : null}
          {dueSoon ? `${dueSoon} due soon` : null}
          {!overdue && !dueSoon ? `${alerts.length} to review` : null}
        </p>
      </div>
      <ul className="max-h-64 divide-y divide-garage-border overflow-y-auto">
        {alerts.map((alert) => {
          const Icon = icon[alert.severity]
          return (
            <li key={alert.id}>
              <button
                type="button"
                onClick={() => onSelect(alert.vehicleId)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5"
              >
                <Icon
                  className={`mt-0.5 size-4 shrink-0 ${severityClass[alert.severity]}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="mt-0.5 text-sm text-garage-muted">
                    {alert.vehicleLabel} · {alert.detail}
                  </p>
                </div>
                <span
                  className={`ml-auto shrink-0 text-[11px] font-semibold uppercase tracking-wider ${severityClass[alert.severity]}`}
                >
                  {alert.severity.replace('-', ' ')}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
