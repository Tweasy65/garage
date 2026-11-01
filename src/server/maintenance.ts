import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { maintenanceRecords, vehicles } from '@/db/schema'
import type { MaintenanceInput } from '@/lib/vehicleTypes'
import { assertVehicleOwner, requireUserId } from '@/server/auth'
import { mapMaintenance } from '@/server/mappers'

function normalizeMaintenanceInput(data: MaintenanceInput) {
  const type = data.type.trim()
  if (!type) throw new Error('Maintenance type is required')
  const date = new Date(data.date)
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid date')

  return {
    vehicleId: data.vehicleId,
    date,
    type,
    description: data.description?.trim() || null,
    costCents: data.costCents ?? null,
    mileage: data.mileage ?? null,
    serviceProvider: data.serviceProvider?.trim() || null,
    nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
    nextDueMileage: data.nextDueMileage ?? null,
  }
}

export const addMaintenanceRecord = createServerFn({ method: 'POST' })
  .inputValidator((data: MaintenanceInput) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId('Sign in to manage maintenance records')
    const values = normalizeMaintenanceInput(data)
    const vehicle = await assertVehicleOwner(values.vehicleId, userId)

    const [row] = await db
      .insert(maintenanceRecords)
      .values({ ...values, userId })
      .returning()

    const nextMileage =
      values.mileage != null && values.mileage > vehicle.mileage
        ? values.mileage
        : undefined

    await db
      .update(vehicles)
      .set({
        updatedAt: new Date(),
        ...(nextMileage != null ? { mileage: nextMileage } : {}),
      })
      .where(eq(vehicles.id, values.vehicleId))

    return { record: mapMaintenance(row) }
  })

export const updateMaintenanceRecord = createServerFn({ method: 'POST' })
  .inputValidator((data: MaintenanceInput & { id: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId('Sign in to manage maintenance records')
    const values = normalizeMaintenanceInput(data)
    const vehicle = await assertVehicleOwner(values.vehicleId, userId)

    const [row] = await db
      .update(maintenanceRecords)
      .set(values)
      .where(
        and(
          eq(maintenanceRecords.id, data.id),
          eq(maintenanceRecords.userId, userId),
        ),
      )
      .returning()

    if (!row) throw new Error('Maintenance record not found')

    const nextMileage =
      values.mileage != null && values.mileage > vehicle.mileage
        ? values.mileage
        : undefined

    await db
      .update(vehicles)
      .set({
        updatedAt: new Date(),
        ...(nextMileage != null ? { mileage: nextMileage } : {}),
      })
      .where(eq(vehicles.id, values.vehicleId))

    return { record: mapMaintenance(row) }
  })

export const deleteMaintenanceRecord = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId('Sign in to manage maintenance records')

    const [row] = await db
      .delete(maintenanceRecords)
      .where(
        and(
          eq(maintenanceRecords.id, data.id),
          eq(maintenanceRecords.userId, userId),
        ),
      )
      .returning({ id: maintenanceRecords.id })

    if (!row) throw new Error('Maintenance record not found')
    return { ok: true }
  })
