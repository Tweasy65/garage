import type { MaintenanceRecord, VehicleSummary } from '@/lib/vehicleTypes'

export type AlertSeverity = 'overdue' | 'due-soon' | 'missing'

export type MaintenanceAlert = {
  id: string
  vehicleId: string
  vehicleLabel: string
  severity: AlertSeverity
  title: string
  detail: string
}

type ServiceRule = {
  key: string
  title: string
  match: RegExp
  miles: number | null
  days: number | null
  soonMiles: number
  soonDays: number
}

/**
 * Default US-market intervals. Classics often need oil sooner; we start
 * conservative and can later store per-vehicle overrides.
 *
 * Planned evolution:
 * 1. Derive last service from maintenance.type (this module).
 * 2. Honor explicit nextDueDate / nextDueMileage on a record.
 * 3. Nightly/on-load check (no cron yet — computed whenever garage loads).
 * 4. Later: Cloudflare scheduled Worker + email/push if still overdue.
 */
const SERVICE_RULES: ServiceRule[] = [
  {
    key: 'oil',
    title: 'Oil change',
    match: /oil(\s+change)?/i,
    miles: 5000,
    days: 180,
    soonMiles: 500,
    soonDays: 30,
  },
  {
    key: 'tires',
    title: 'Tire rotation',
    match: /tire\s*rotat/i,
    miles: 7500,
    days: 365,
    soonMiles: 500,
    soonDays: 30,
  },
  {
    key: 'inspection',
    title: 'Inspection',
    match: /inspection/i,
    miles: null,
    days: 365,
    soonMiles: 0,
    soonDays: 30,
  },
]

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000)
}

function latestMatching(
  records: MaintenanceRecord[],
  match: RegExp,
): MaintenanceRecord | undefined {
  return records.find((record) => match.test(record.type))
}

function explicitDueAlerts(
  vehicle: VehicleSummary,
  records: MaintenanceRecord[],
  now: Date,
): MaintenanceAlert[] {
  const alerts: MaintenanceAlert[] = []
  for (const record of records) {
    if (record.nextDueDate) {
      const due = new Date(record.nextDueDate)
      const remaining = daysBetween(now, due)
      if (remaining < 0) {
        alerts.push({
          id: `${vehicle.id}-due-date-${record.id}`,
          vehicleId: vehicle.id,
          vehicleLabel: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          severity: 'overdue',
          title: `${record.type} overdue`,
          detail: `Scheduled for ${due.toLocaleDateString()} (${Math.abs(remaining)} days ago).`,
        })
      } else if (remaining <= 30) {
        alerts.push({
          id: `${vehicle.id}-due-date-${record.id}`,
          vehicleId: vehicle.id,
          vehicleLabel: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          severity: 'due-soon',
          title: `${record.type} due soon`,
          detail: `Due ${due.toLocaleDateString()} (${remaining} days).`,
        })
      }
    }
    if (record.nextDueMileage != null) {
      const remaining = record.nextDueMileage - vehicle.mileage
      if (remaining <= 0) {
        alerts.push({
          id: `${vehicle.id}-due-mi-${record.id}`,
          vehicleId: vehicle.id,
          vehicleLabel: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          severity: 'overdue',
          title: `${record.type} overdue`,
          detail: `Due at ${record.nextDueMileage.toLocaleString()} mi — currently ${vehicle.mileage.toLocaleString()} mi.`,
        })
      } else if (remaining <= 500) {
        alerts.push({
          id: `${vehicle.id}-due-mi-${record.id}`,
          vehicleId: vehicle.id,
          vehicleLabel: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          severity: 'due-soon',
          title: `${record.type} due soon`,
          detail: `${remaining.toLocaleString()} miles until ${record.nextDueMileage.toLocaleString()} mi.`,
        })
      }
    }
  }
  return alerts
}

function intervalAlert(
  vehicle: VehicleSummary,
  records: MaintenanceRecord[],
  rule: ServiceRule,
  now: Date,
): MaintenanceAlert | null {
  const last = latestMatching(records, rule.match)
  const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  if (!last) {
    return {
      id: `${vehicle.id}-${rule.key}-missing`,
      vehicleId: vehicle.id,
      vehicleLabel: label,
      severity: 'missing',
      title: `No ${rule.title.toLowerCase()} on record`,
      detail: `Add a ${rule.title.toLowerCase()} so Garage can track the next interval.`,
    }
  }

  const lastDate = new Date(last.date)
  const elapsedDays = daysBetween(lastDate, now)
  const elapsedMiles =
    last.mileage != null ? vehicle.mileage - last.mileage : null

  if (rule.days != null && elapsedDays >= rule.days) {
    return {
      id: `${vehicle.id}-${rule.key}-time`,
      vehicleId: vehicle.id,
      vehicleLabel: label,
      severity: 'overdue',
      title: `${rule.title} overdue`,
      detail: `Last ${rule.title.toLowerCase()} ${elapsedDays} days ago (${lastDate.toLocaleDateString()}).`,
    }
  }

  if (
    rule.miles != null &&
    elapsedMiles != null &&
    elapsedMiles >= rule.miles
  ) {
    return {
      id: `${vehicle.id}-${rule.key}-miles`,
      vehicleId: vehicle.id,
      vehicleLabel: label,
      severity: 'overdue',
      title: `${rule.title} overdue`,
      detail: `${elapsedMiles.toLocaleString()} miles since last ${rule.title.toLowerCase()} (interval ${rule.miles.toLocaleString()} mi).`,
    }
  }

  if (rule.days != null && elapsedDays >= rule.days - rule.soonDays) {
    return {
      id: `${vehicle.id}-${rule.key}-time-soon`,
      vehicleId: vehicle.id,
      vehicleLabel: label,
      severity: 'due-soon',
      title: `${rule.title} due soon`,
      detail: `${rule.days - elapsedDays} days left in the ${rule.days}-day interval.`,
    }
  }

  if (
    rule.miles != null &&
    elapsedMiles != null &&
    elapsedMiles >= rule.miles - rule.soonMiles
  ) {
    const remaining = rule.miles - elapsedMiles
    return {
      id: `${vehicle.id}-${rule.key}-miles-soon`,
      vehicleId: vehicle.id,
      vehicleLabel: label,
      severity: 'due-soon',
      title: `${rule.title} due soon`,
      detail: `${remaining.toLocaleString()} miles left in the ${rule.miles.toLocaleString()}-mile interval.`,
    }
  }

  return null
}

export function computeMaintenanceAlerts(
  vehicles: VehicleSummary[],
  recordsByVehicle: Record<string, MaintenanceRecord[]>,
  now = new Date(),
): MaintenanceAlert[] {
  const alerts: MaintenanceAlert[] = []

  for (const vehicle of vehicles) {
    const records = [...(recordsByVehicle[vehicle.id] ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    alerts.push(...explicitDueAlerts(vehicle, records, now))
    for (const rule of SERVICE_RULES) {
      const alert = intervalAlert(vehicle, records, rule, now)
      if (alert) alerts.push(alert)
    }
  }

  const rank = { overdue: 0, 'due-soon': 1, missing: 2 }
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity])
}
