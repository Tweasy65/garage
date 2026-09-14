import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { maintenanceRecords, vehicles } from '@/db/schema'
import type {
  MaintenanceRecord,
  VehicleDetail,
  VehicleInput,
  VehicleSummary,
} from '@/lib/vehicleTypes'

async function requireUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('Sign in to manage your garage')
  return userId
}

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null
}

function mapMaintenance(row: typeof maintenanceRecords.$inferSelect): MaintenanceRecord {
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

function mapVehicleSummary(
  row: typeof vehicles.$inferSelect,
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

function mapVehicleDetail(
  row: typeof vehicles.$inferSelect,
  maintenance: MaintenanceRecord[],
): VehicleDetail {
  return {
    ...mapVehicleSummary(row, maintenance.length),
    vin: row.vin,
    licensePlate: row.licensePlate,
    purchaseDate: toIso(row.purchaseDate),
    notes: row.notes,
    bodyStyle: row.bodyStyle,
    transmission: row.transmission,
    fuelType: row.fuelType,
    drivetrain: row.drivetrain,
    engineType: row.engineType,
    engineSize: row.engineSize,
    seatingCapacity: row.seatingCapacity,
    mpgCity: row.mpgCity,
    mpgHighway: row.mpgHighway,
    titleStatus: row.titleStatus,
    maintenance,
  }
}

function normalizeVehicleInput(data: VehicleInput) {
  const make = data.make.trim()
  const model = data.model.trim()
  if (!make || !model) throw new Error('Make and model are required')
  if (!Number.isFinite(data.year) || data.year < 1886 || data.year > 2100) {
    throw new Error('Enter a valid year')
  }
  if (!Number.isFinite(data.mileage) || data.mileage < 0) {
    throw new Error('Mileage must be zero or greater')
  }

  return {
    make,
    model,
    trim: data.trim?.trim() || null,
    year: data.year,
    color: data.color?.trim() || null,
    vin: data.vin?.trim() || null,
    licensePlate: data.licensePlate?.trim() || null,
    mileage: Math.round(data.mileage),
    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
    notes: data.notes?.trim() || null,
    isProject: Boolean(data.isProject),
    isFavorite: Boolean(data.isFavorite),
    bodyStyle: data.bodyStyle?.trim() || null,
    transmission: data.transmission?.trim() || null,
    fuelType: data.fuelType?.trim() || null,
    drivetrain: data.drivetrain?.trim() || null,
    engineType: data.engineType?.trim() || null,
    engineSize: data.engineSize?.trim() || null,
    seatingCapacity: data.seatingCapacity ?? null,
    mpgCity: data.mpgCity ?? null,
    mpgHighway: data.mpgHighway ?? null,
    titleStatus: data.titleStatus?.trim() || null,
    imageUrl: data.imageUrl?.trim() || null,
    tags: (data.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
  }
}

export const listVehicles = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  if (!userId) {
    return { vehicles: [] as VehicleSummary[] }
  }

  const rows = await db
    .select({
      vehicle: vehicles,
      maintenanceCount: count(maintenanceRecords.id),
    })
    .from(vehicles)
    .leftJoin(maintenanceRecords, eq(maintenanceRecords.vehicleId, vehicles.id))
    .where(eq(vehicles.userId, userId))
    .groupBy(vehicles.id)
    .orderBy(desc(vehicles.isFavorite), desc(vehicles.updatedAt))

  return {
    vehicles: rows.map((row) =>
      mapVehicleSummary(row.vehicle, Number(row.maintenanceCount)),
    ),
  }
})

export const getVehicle = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, data.id), eq(vehicles.userId, userId)))
      .limit(1)

    if (!vehicle) throw new Error('Vehicle not found')

    const maintenance = await db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.vehicleId, vehicle.id))
      .orderBy(desc(maintenanceRecords.date))

    return {
      vehicle: mapVehicleDetail(vehicle, maintenance.map(mapMaintenance)),
    }
  })

export const createVehicle = createServerFn({ method: 'POST' })
  .inputValidator((data: VehicleInput) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const values = normalizeVehicleInput(data)

    const [row] = await db
      .insert(vehicles)
      .values({ ...values, userId })
      .returning()

    return { vehicle: mapVehicleDetail(row, []) }
  })

export const updateVehicle = createServerFn({ method: 'POST' })
  .inputValidator((data: VehicleInput & { id: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const values = normalizeVehicleInput(data)

    const [row] = await db
      .update(vehicles)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(vehicles.id, data.id), eq(vehicles.userId, userId)))
      .returning()

    if (!row) throw new Error('Vehicle not found')

    const maintenance = await db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.vehicleId, row.id))
      .orderBy(desc(maintenanceRecords.date))

    return { vehicle: mapVehicleDetail(row, maintenance.map(mapMaintenance)) }
  })

export const deleteVehicle = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    const [row] = await db
      .delete(vehicles)
      .where(and(eq(vehicles.id, data.id), eq(vehicles.userId, userId)))
      .returning({ id: vehicles.id })

    if (!row) throw new Error('Vehicle not found')
    return { ok: true }
  })
