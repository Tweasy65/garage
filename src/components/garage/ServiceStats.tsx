import { Receipt, Timer, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo } from 'react'

import { formatDate } from '@/lib/format'
import type { MaintenanceAlert } from '@/lib/maintenanceAlerts'
import type { ServiceRecord } from '@/lib/vehicleTypes'

export const RECENT_DAYS = 90
const DAY_MS = 86_400_000

export type StatFilter = 'overdue' | 'due-soon' | 'recent'

type Stat = {
  label: string
  value: string
  hint: string
  tone?: 'danger' | 'warn' | 'good'
  filter?: StatFilter
}

type ServiceStatsProps = {
  alerts: MaintenanceAlert[]
  records: ServiceRecord[]
  activeStatus?: string
  onSelectStatus?: (status: StatFilter) => void
}

const toneClass = {
  danger: 'text-red-300',
  warn: 'text-amber-300',
  good: 'text-emerald-300',
}

export function isRecent(date: string, now: Date) {
  return time(date) >= now.getTime() - RECENT_DAYS * DAY_MS
}

export default function ServiceStats({
  alerts,
  records,
  activeStatus,
  onSelectStatus,
}: ServiceStatsProps) {
  const stats = useMemo(() => computeStats(alerts, records, new Date()), [alerts, records])

  return (
    <section className="garage-panel grid divide-y divide-garage-border md:grid-cols-3 md:divide-x md:divide-y-0">
      <StatSection
        icon={Wrench}
        title="Overview"
        stats={stats.overview}
        activeStatus={activeStatus}
        onSelect={onSelectStatus}
      />
      <StatSection icon={Receipt} title="Spending" stats={stats.spending} />
      <StatSection icon={Timer} title="Timing" stats={stats.timing} />
    </section>
  )
}

function StatSection({
  icon: Icon,
  title,
  stats,
  activeStatus,
  onSelect,
}: {
  icon: LucideIcon
  title: string
  stats: Stat[]
  activeStatus?: string
  onSelect?: (status: StatFilter) => void
}) {
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-1.5 px-1">
        <Icon className="size-3.5 text-garage-muted" />
        <p className="label-caps">{title}</p>
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1">
        {stats.map((stat) => {
          const body = (
            <>
              <span
                className={`block truncate text-lg font-semibold leading-tight tabular-nums tracking-tight ${
                  stat.tone ? toneClass[stat.tone] : ''
                }`}
              >
                {stat.value}
              </span>
              <span className="block truncate text-[11px] text-garage-muted">{stat.label}</span>
            </>
          )
          if (!stat.filter || !onSelect) {
            return (
              <div key={stat.label} className="min-w-0 px-1 py-1" title={stat.hint}>
                {body}
              </div>
            )
          }
          const active = activeStatus === stat.filter
          const filter = stat.filter
          return (
            <button
              key={stat.label}
              type="button"
              title={active ? `${stat.hint} · click to clear filter` : `${stat.hint} · click to filter`}
              aria-pressed={active}
              onClick={() => onSelect(filter)}
              className={`min-w-0 rounded-sm px-1 py-1 text-left transition hover:bg-white/5 ${
                active ? 'bg-white/10 ring-1 ring-inset ring-garage-border' : ''
              }`}
            >
              {body}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function computeStats(alerts: MaintenanceAlert[], records: ServiceRecord[], now: Date) {
  const overdueCars = distinctVehicles(alerts, 'overdue')
  const upcomingCars = distinctVehicles(alerts, 'due-soon')
  const recent = records.filter((record) => isRecent(record.date, now))

  const costed = records.filter((record) => record.costCents != null)
  const total = sum(costed.map((record) => record.costCents ?? 0))
  const year = now.getFullYear()
  const thisYear = sum(
    costed
      .filter((record) => new Date(record.date).getFullYear() === year)
      .map((record) => record.costCents ?? 0),
  )
  const average = costed.length ? Math.round(total / costed.length) : null

  const sorted = [...records].sort((a, b) => time(b.date) - time(a.date))
  const last = sorted[0]
  const daysSinceLast = last ? Math.max(0, Math.floor((now.getTime() - time(last.date)) / DAY_MS)) : null
  const interval = averageInterval(records)
  const commonType = mostCommon(records.map((record) => record.type))

  const overview: Stat[] = [
    {
      label: 'Need service',
      value: String(overdueCars),
      hint: overdueCars ? 'Cars overdue by date or mileage' : 'Nothing overdue',
      tone: overdueCars ? 'danger' : 'good',
      filter: 'overdue',
    },
    {
      label: 'Next 30 days',
      value: String(upcomingCars),
      hint: 'Cars with service coming due in the next 30 days',
      tone: upcomingCars ? 'warn' : undefined,
      filter: 'due-soon',
    },
    {
      label: 'Recent',
      value: String(recent.length),
      hint: `Services logged in the last ${RECENT_DAYS} days`,
      filter: 'recent',
    },
  ]

  const spending: Stat[] = [
    {
      label: 'This year',
      value: dollars(thisYear),
      hint: `Spent in ${year}`,
    },
    {
      label: 'Lifetime',
      value: dollars(total),
      hint: `${records.length} service${records.length === 1 ? '' : 's'} on record`,
    },
    {
      label: 'Avg / service',
      value: average != null ? dollars(average) : '—',
      hint: costed.length ? `Across ${costed.length} services with a cost` : 'No costs logged yet',
    },
  ]

  const timing: Stat[] = [
    {
      label: 'Since last',
      value: daysSinceLast != null ? `${daysSinceLast}d` : '—',
      hint: last ? `${last.type} · ${formatDate(last.date)}` : 'No services logged',
    },
    {
      label: 'Avg interval',
      value: interval != null ? `${interval}d` : '—',
      hint: interval != null ? 'Average days between services per car' : 'Needs two services on a car',
    },
    {
      label: commonType ? `${commonType.count}× logged` : 'Most common',
      value: commonType ? commonType.value : '—',
      hint: commonType ? `Most common service: ${commonType.value}` : 'No services logged',
    },
  ]

  return { overview, spending, timing }
}

function dollars(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function distinctVehicles(alerts: MaintenanceAlert[], severity: MaintenanceAlert['severity']) {
  return new Set(alerts.filter((alert) => alert.severity === severity).map((alert) => alert.vehicleId)).size
}

function averageInterval(records: ServiceRecord[]) {
  const byVehicle = new Map<string, number[]>()
  for (const record of records) {
    const list = byVehicle.get(record.vehicleId) ?? []
    list.push(time(record.date))
    byVehicle.set(record.vehicleId, list)
  }
  const gaps: number[] = []
  for (const times of byVehicle.values()) {
    times.sort((a, b) => a - b)
    for (let i = 1; i < times.length; i++) gaps.push((times[i] - times[i - 1]) / DAY_MS)
  }
  return gaps.length ? Math.round(sum(gaps) / gaps.length) : null
}

function mostCommon(values: string[]) {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  let best: { value: string; count: number } | null = null
  for (const [value, count] of counts) {
    if (!best || count > best.count) best = { value, count }
  }
  return best
}

function time(value: string) {
  return new Date(value).getTime()
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}
