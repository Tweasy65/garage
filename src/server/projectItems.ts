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
} from '@/lib/vehicleTypes'
import {
  assertVehicleOwner,
  optionalUserId,
  ownedVehicleSummaryColumns,
  requireUserId,
} from '@/server/auth'
import { mapVehicleSummary } from '@/server/mappers'

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

export async function loadProjectItems(
  vehicleId: string,
  userId: string,
): Promise<ProjectItem[]> {
  const rows = await db
    .select()
    .from(projectItems)
    .where(
      and(
        eq(projectItems.vehicleId, vehicleId),
        eq(projectItems.userId, userId),
      ),
    )
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

export const listProjectBoards = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await optionalUserId()
    if (!userId) {
      return { boards: [] as ProjectBoard[] }
    }

    const projectVehicles = await db
      .select(ownedVehicleSummaryColumns)
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
        vehicle: mapVehicleSummary(vehicle, 0),
        items: itemsByVehicle[vehicle.id] ?? [],
      })),
    }
  },
)

export const addProjectItem = createServerFn({ method: 'POST' })
  .inputValidator((data: ProjectItemInput) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId('Sign in to manage project lists')
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
    const userId = await requireUserId('Sign in to manage project lists')

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

export const reorderProjectItems = createServerFn({ method: 'POST' })
  .inputValidator((data: { vehicleId: string; orderedIds: string[] }) => {
    const orderedIds = data.orderedIds.filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    )
    if (!data.vehicleId) throw new Error('Vehicle is required')
    return { vehicleId: data.vehicleId, orderedIds: [...new Set(orderedIds)] }
  })
  .handler(async ({ data }) => {
    const userId = await requireUserId('Sign in to manage project lists')
    await assertVehicleOwner(data.vehicleId, userId)

    if (data.orderedIds.length === 0) return { ok: true }

    const owned = await db
      .select({ id: projectItems.id })
      .from(projectItems)
      .where(
        and(
          eq(projectItems.vehicleId, data.vehicleId),
          eq(projectItems.userId, userId),
        ),
      )
    const ownedIds = new Set(owned.map((row) => row.id))
    if (data.orderedIds.some((id) => !ownedIds.has(id))) {
      throw new Error('List item not found')
    }

    for (const [index, id] of data.orderedIds.entries()) {
      await db
        .update(projectItems)
        .set({ sortOrder: (index + 1) * 10, updatedAt: new Date() })
        .where(eq(projectItems.id, id))
    }

    return { ok: true }
  })

export const deleteProjectItem = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId('Sign in to manage project lists')

    const [row] = await db
      .delete(projectItems)
      .where(
        and(eq(projectItems.id, data.id), eq(projectItems.userId, userId)),
      )
      .returning({ id: projectItems.id })

    if (!row) throw new Error('List item not found')
    return { ok: true }
  })
