import { auth } from '@clerk/tanstack-react-start/server'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { vehicles } from '@/db/schema'

export async function optionalUserId(): Promise<string | null> {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated || !userId) return null
  return userId
}

export async function requireUserId(
  message = 'Sign in to manage your garage',
): Promise<string> {
  const userId = await optionalUserId()
  if (!userId) throw new Error(message)
  return userId
}

export const ownedVehicleSummaryColumns = {
  id: vehicles.id,
  make: vehicles.make,
  model: vehicles.model,
  trim: vehicles.trim,
  year: vehicles.year,
  color: vehicles.color,
  mileage: vehicles.mileage,
  isProject: vehicles.isProject,
  isFavorite: vehicles.isFavorite,
  imageUrl: vehicles.imageUrl,
  tags: vehicles.tags,
} as const

export async function assertVehicleOwner(vehicleId: string, userId: string) {
  const [vehicle] = await db
    .select(ownedVehicleSummaryColumns)
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)))
    .limit(1)

  if (!vehicle) throw new Error('Vehicle not found')
  return vehicle
}
