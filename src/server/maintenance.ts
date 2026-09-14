import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { maintenanceRecords, vehicles } from '@/db/schema'
import type { MaintenanceInput } from '@/lib/vehicleTypes'

async function requireUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('Sign in to manage maintenance records')
  return userId
}

async function assertVehicleOwner(vehicleId: string, userId: string) {
  const [vehicle] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)))
    .limit(1)

  if (!vehicle) throw new Error('Vehicle not found')
}

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
    const userId = await requireUserId()
    const values = normalizeMaintenanceInput(data)
    await assertVehicleOwner(values.vehicleId, userId)

    const [row] = await db
      .insert(maintenanceRecords)
      .values({ ...values, userId })
      .returning()

    await db
      .update(vehicles)
      .set({ updatedAt: new Date() })
      .where(eq(vehicles.id, values.vehicleId))

    return {
      record: {
        id: row.id,
        vehicleId: row.vehicleId,
        date: row.date.toISOString(),
        type: row.type,
        description: row.description,
        costCents: row.costCents,
        mileage: row.mileage,
        serviceProvider: row.serviceProvider,
        nextDueDate: row.nextDueDate?.toISOString() ?? null,
        nextDueMileage: row.nextDueMileage,
      },
    }
  })

export const deleteMaintenanceRecord = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()

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
