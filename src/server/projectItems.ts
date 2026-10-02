import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { projectItems, vehicles } from '@/db/schema'
import {
  parseProjectArea,
  type ProjectArea,
} from '@/lib/projectItems'
import type {
  ProjectBoard,
  ProjectItem,
  ProjectItemInput,
  VehicleSummary,
} from '@/lib/vehicleTypes'

async function requireUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('Sign in to manage project lists')
  return userId
}

async function assertVehicleOwner(vehicleId: string, userId: string) {
  const [vehicle] = await db
    .select({
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
    })
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)))
    .limit(1)

  if (!vehicle) throw new Error('Vehicle not found')
  return vehicle
}

function mapProjectItem(row: typeof projectItems.$inferSelect): ProjectItem {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    title: row.title,
    notes: row.notes,
    instructionsMd: row.instructionsMd,
    area: parseProjectArea(row.area),
    done: row.done,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function loadProjectItems(vehicleId: string): Promise<ProjectItem[]> {
  const rows = await db
    .select()
    .from(projectItems)
    .where(eq(projectItems.vehicleId, vehicleId))
    .orderBy(asc(projectItems.sortOrder), asc(projectItems.createdAt))

  return rows.map(mapProjectItem)
}

function normalizeNewItem(data: ProjectItemInput) {
  const title = data.title.trim()
  if (!title) throw new Error('Enter a list item')
  return {
    vehicleId: data.vehicleId,
    title,
    notes: data.notes?.trim() || null,
    area: parseProjectArea(data.area),
  }
}

async function nextSortOrder(
  vehicleId: string,
  area: ProjectArea,
): Promise<number> {
  const rows = await db
    .select({ sortOrder: projectItems.sortOrder })
    .from(projectItems)
    .where(
      and(eq(projectItems.vehicleId, vehicleId), eq(projectItems.area, area)),
    )

  const max = rows.reduce((acc, row) => Math.max(acc, row.sortOrder), 0)
  return max + 10
}

function toSummary(
  row: Awaited<ReturnType<typeof assertVehicleOwner>>,
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
    maintenanceCount: 0,
  }
}

export const listProjectBoards = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { userId } = await auth()
    if (!userId) {
      return { boards: [] as ProjectBoard[] }
    }

    const projectVehicles = await db
      .select({
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
      })
      .from(vehicles)
      .where(and(eq(vehicles.userId, userId), eq(vehicles.isProject, true)))
      .orderBy(desc(vehicles.isFavorite), desc(vehicles.updatedAt))

    if (projectVehicles.length === 0) {
      return { boards: [] as ProjectBoard[] }
    }

    const itemRows = await db
      .select()
      .from(projectItems)
      .where(eq(projectItems.userId, userId))

    const itemsByVehicle: Record<string, ProjectItem[]> = {}
    for (const row of itemRows) {
      const list = itemsByVehicle[row.vehicleId] ?? []
      list.push(mapProjectItem(row))
      itemsByVehicle[row.vehicleId] = list
    }

    return {
      boards: projectVehicles.map((vehicle) => ({
        vehicle: toSummary(vehicle),
        items: itemsByVehicle[vehicle.id] ?? [],
      })),
    }
  },
)

export const addProjectItem = createServerFn({ method: 'POST' })
  .inputValidator((data: ProjectItemInput) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const values = normalizeNewItem(data)
    await assertVehicleOwner(values.vehicleId, userId)

    const [row] = await db
      .insert(projectItems)
      .values({
        ...values,
        userId,
        sortOrder: await nextSortOrder(values.vehicleId, values.area),
      })
      .returning()

    await db
      .update(vehicles)
      .set({ updatedAt: new Date() })
      .where(eq(vehicles.id, values.vehicleId))

    return { item: mapProjectItem(row) }
  })

export const updateProjectItem = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: string
      title?: string
      notes?: string | null
      instructionsMd?: string | null
      area?: ProjectArea
      done?: boolean
    }) => data,
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    const [existing] = await db
      .select()
      .from(projectItems)
      .where(and(eq(projectItems.id, data.id), eq(projectItems.userId, userId)))
      .limit(1)

    if (!existing) throw new Error('List item not found')

    const patch: Partial<typeof projectItems.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (data.title !== undefined) {
      const title = data.title.trim()
      if (!title) throw new Error('Enter a list item')
      patch.title = title
    }
    if (data.notes !== undefined) {
      patch.notes = data.notes?.trim() || null
    }
    if (data.instructionsMd !== undefined) {
      patch.instructionsMd = data.instructionsMd?.trim() || null
    }
    if (data.area !== undefined) {
      patch.area = parseProjectArea(data.area)
    }
    if (data.done !== undefined) {
      patch.done = data.done
      patch.completedAt = data.done ? new Date() : null
    }

    const [row] = await db
      .update(projectItems)
      .set(patch)
      .where(eq(projectItems.id, existing.id))
      .returning()

    if (!row) throw new Error('List item not found')
    return { item: mapProjectItem(row) }
  })

export const deleteProjectItem = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    const [row] = await db
      .delete(projectItems)
      .where(
        and(eq(projectItems.id, data.id), eq(projectItems.userId, userId)),
      )
      .returning({ id: projectItems.id })

    if (!row) throw new Error('List item not found')
    return { ok: true }
  })
