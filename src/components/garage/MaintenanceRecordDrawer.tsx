import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import Drawer from '@/components/garage/Drawer'
import MaintenanceForm from '@/components/garage/MaintenanceForm'
import { formatDate, formatMiles, formatMoney } from '@/lib/format'
import type { MaintenanceInput, MaintenanceRecord } from '@/lib/vehicleTypes'

export type ListedMaintenanceRecord = MaintenanceRecord & {
  vehicleLabel?: string
}

type MaintenanceRecordDrawerProps = {
  record: ListedMaintenanceRecord | null
  open: boolean
  onClose: () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, values: MaintenanceInput) => Promise<void>
}

export default function MaintenanceRecordDrawer({
  record,
  open,
  onClose,
  onDelete,
  onUpdate,
}: MaintenanceRecordDrawerProps) {
  const [editing, setEditing] = useState(false)
  const activeRecord = record

  useEffect(() => {
    if (!open) setEditing(false)
  }, [open, activeRecord?.id])

  if (!activeRecord) return null

  const recordId = activeRecord.id
  const recordVehicleId = activeRecord.vehicleId

  function handleDelete() {
    if (!window.confirm('Remove this service record?')) return
    onDelete(recordId)
    onClose()
  }

  async function handleUpdate(values: MaintenanceInput) {
    await onUpdate(recordId, values)
    setEditing(false)
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      hint={editing ? 'Edit' : 'Service record'}
      title={editing ? 'Edit service' : activeRecord.type}
    >
      {editing ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <MaintenanceForm
            vehicleId={recordVehicleId}
            initialRecord={activeRecord}
            submitLabel="Save changes"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <dl className="space-y-5 overflow-y-auto px-5 py-5">
            {activeRecord.vehicleLabel ? (
              <DetailRow label="Vehicle" value={activeRecord.vehicleLabel} />
            ) : null}
            <DetailRow label="Date" value={formatDate(activeRecord.date) ?? '—'} />
            <DetailRow
              label="Odometer"
              value={activeRecord.mileage != null ? formatMiles(activeRecord.mileage) : '—'}
            />
            <DetailRow label="Cost" value={formatMoney(activeRecord.costCents) || '—'} />
            <DetailRow label="Provider" value={activeRecord.serviceProvider || '—'} />
            <DetailRow
              label="Next due"
              value={
                activeRecord.nextDueDate || activeRecord.nextDueMileage != null
                  ? [
                      activeRecord.nextDueDate ? formatDate(activeRecord.nextDueDate) : null,
                      activeRecord.nextDueMileage != null
                        ? formatMiles(activeRecord.nextDueMileage)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : '—'
              }
            />
            <div>
              <dt className="label-caps">Notes</dt>
              <dd className="mt-2 text-sm leading-relaxed text-garage-muted">
                {activeRecord.description?.trim() || 'No description on this record.'}
              </dd>
            </div>
          </dl>
          <div className="mt-auto flex flex-wrap gap-2 border-t border-garage-border px-5 py-4">
            <button type="button" className="btn-primary" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Edit record
            </button>
            <button
              type="button"
              className="btn border-red-400/30 text-red-300 hover:bg-red-400/10"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              Remove record
            </button>
          </div>
        </div>
      )}
    </Drawer>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-caps">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  )
}
