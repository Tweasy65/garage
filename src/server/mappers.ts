import { maintenanceRecords, vehicles } from '@/db/schema'
import type { MaintenanceRecord, VehicleSummary } from '@/lib/vehicleTypes'

export function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null
}

export function mapMaintenance(
  row: typeof maintenanceRecords.$inferSelect,
): MaintenanceRecord {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    date: row.date.toISOString(),
    type: row.type,
    description: row.description,
    costCents: row.costCents,
    mileage: row.mileage,
    serviceProvider: row.serviceProvider,
    nextDueDate: toIso(row.nextDueDate),
    nextDueMileage: row.nextDueMileage,
  }
}

export type VehicleSummaryRow = Pick<
  typeof vehicles.$inferSelect,
  | 'id'
  | 'make'
  | 'model'
  | 'trim'
  | 'year'
  | 'color'
  | 'mileage'
  | 'isProject'
  | 'isFavorite'
  | 'imageUrl'
  | 'tags'
>

export function mapVehicleSummary(
  row: VehicleSummaryRow,
  maintenanceCount: number,
): VehicleSummary {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    trim: row.trim,
    year: row.year,
    color: row.color,
    mileage: row.mileage,
    isProject: row.isProject,
    isFavorite: row.isFavorite,
    imageUrl: row.imageUrl,
    tags: row.tags ?? [],
    maintenanceCount,
  }
}
