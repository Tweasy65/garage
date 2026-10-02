import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { randomUUID } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { maintenanceRecords, vehicles } from '@/db/schema'
import { computeMaintenanceAlerts } from '@/lib/maintenanceAlerts'
import type { MaintenanceAlert } from '@/lib/maintenanceAlerts'
import { vehicleToInput } from '@/lib/vehicleFormValues'
import { mergeTagLists } from '@/lib/tagUtils'
import type {
  MaintenanceRecord,
  ProjectItem,
  ServiceRecord,
  VehicleAsset,
  VehicleDetail,
  VehicleInput,
  VehicleSummary,
} from '@/lib/vehicleTypes'
import { loadProjectItems } from '@/server/projectItems'

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
  row: Pick<
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
  >,
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
  projectItemRows: ProjectItem[] = [],
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
    assets: normalizeAssets(row.assets, row.imageUrl),
    modelAssetId: row.modelAssetId,
    maintenance,
    projectItems: projectItemRows,
  }
}

const MAX_ASSETS = 16
const MAX_ASSET_CHARS = 12_000_000

function normalizeAssets(
  assets: VehicleAsset[] | null | undefined,
  coverUrl?: string | null,
): VehicleAsset[] {
  const list = Array.isArray(assets) ? assets : []
  const cleaned: VehicleAsset[] = []
  for (const asset of list) {
    if (!asset || typeof asset !== 'object') continue
    if (asset.kind !== 'image' && asset.kind !== 'model') continue
    const src = typeof asset.src === 'string' ? asset.src.trim() : ''
    const id = typeof asset.id === 'string' ? asset.id.trim() : ''
    if (!src || !id || src.length > MAX_ASSET_CHARS) continue
    cleaned.push({
      id,
      kind: asset.kind,
      name: (asset.name || 'Untitled').slice(0, 120),
      mime: (asset.mime || '').slice(0, 80),
      src,
      createdAt: asset.createdAt || new Date().toISOString(),
    })
    if (cleaned.length >= MAX_ASSETS) break
  }
  if (
    coverUrl &&
    !cleaned.some((asset) => asset.kind === 'image' && asset.src === coverUrl)
  ) {
    cleaned.unshift({
      id: 'legacy-cover',
      kind: 'image',
      name: 'Cover photo',
      mime: 'image/*',
      src: coverUrl,
      createdAt: new Date().toISOString(),
    })
  }
  return cleaned
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

  const assets = normalizeAssets(data.assets, data.imageUrl)
  const requestedCover = data.imageUrl?.trim() || null
  const imageUrl =
    requestedCover &&
    assets.some((asset) => asset.kind === 'image' && asset.src === requestedCover)
      ? requestedCover
      : (assets.find((asset) => asset.kind === 'image')?.src ?? null)
  const requestedModel = data.modelAssetId?.trim() || null
  const modelAssetId =
    requestedModel &&
    assets.some((asset) => asset.id === requestedModel && asset.kind === 'model')
      ? requestedModel
      : (assets.find((asset) => asset.kind === 'model')?.id ?? null)

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
    imageUrl,
    assets,
    modelAssetId,
    tags: (data.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
  }
}

export const listVehicles = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  if (!userId) {
    return { vehicles: [] as VehicleSummary[], alerts: [] as MaintenanceAlert[] }
  }
  const garage = await loadGarage(userId)
  return { vehicles: garage.vehicles, alerts: garage.alerts }
})

export const listMaintenanceAlerts = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  if (!userId) {
    return { alerts: [] as MaintenanceAlert[] }
  }
  const garage = await loadGarage(userId)
  return { alerts: garage.alerts }
})

export const listGarageTags = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUserId()
  const rows = await db
    .select({ tags: vehicles.tags })
    .from(vehicles)
    .where(eq(vehicles.userId, userId))

  const collected: string[][] = rows.map((row) => row.tags ?? [])
  return { tags: mergeTagLists(...collected) }
})

export const listService = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  if (!userId) {
    return {
      vehicles: [] as VehicleSummary[],
      alerts: [] as MaintenanceAlert[],
      records: [] as ServiceRecord[],
    }
  }
  return loadGarage(userId)
})

async function loadGarage(userId: string) {
  const rows = await db
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
    .where(eq(vehicles.userId, userId))
    .orderBy(desc(vehicles.isFavorite), desc(vehicles.updatedAt))

  const maintenanceRows = await db
    .select()
    .from(maintenanceRecords)
    .where(eq(maintenanceRecords.userId, userId))

  const recordsByVehicle: Record<string, MaintenanceRecord[]> = {}
  for (const row of maintenanceRows) {
    const list = recordsByVehicle[row.vehicleId] ?? []
    list.push(mapMaintenance(row))
    recordsByVehicle[row.vehicleId] = list
  }

  const vehiclesList = rows.map((row) =>
    mapVehicleSummary(row, recordsByVehicle[row.id]?.length ?? 0),
  )
  const labels = new Map(
    vehiclesList.map((vehicle) => [
      vehicle.id,
      `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    ]),
  )
  const records: ServiceRecord[] = (recordsByVehicle
    ? Object.values(recordsByVehicle).flat()
    : []
  )
    .map((record) => ({
      ...record,
      vehicleLabel: labels.get(record.vehicleId) ?? 'Vehicle',
    }))
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

  return {
    vehicles: vehiclesList,
    alerts: computeMaintenanceAlerts(vehiclesList, recordsByVehicle),
    records,
  }
}

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
      vehicle: mapVehicleDetail(
        vehicle,
        maintenance.map(mapMaintenance),
        await loadProjectItems(vehicle.id),
      ),
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

    return { vehicle: mapVehicleDetail(row, [], []) }
  })

async function loadVehicleDetailForUser(vehicleId: string, userId: string) {
  const [row] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)))
    .limit(1)

  if (!row) throw new Error('Vehicle not found')

  const maintenance = await db
    .select()
    .from(maintenanceRecords)
    .where(eq(maintenanceRecords.vehicleId, row.id))
    .orderBy(desc(maintenanceRecords.date))

  return mapVehicleDetail(
    row,
    maintenance.map(mapMaintenance),
    await loadProjectItems(row.id),
  )
}

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

    return { vehicle: await loadVehicleDetailForUser(row.id, userId) }
  })

export const updateVehicleMileage = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; mileage: number }) => {
    if (!Number.isFinite(data.mileage) || data.mileage < 0) {
      throw new Error('Enter a valid odometer reading')
    }
    return { id: data.id, mileage: Math.round(data.mileage) }
  })
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    const [row] = await db
      .update(vehicles)
      .set({ mileage: data.mileage, updatedAt: new Date() })
      .where(and(eq(vehicles.id, data.id), eq(vehicles.userId, userId)))
      .returning({ id: vehicles.id })

    if (!row) throw new Error('Vehicle not found')

    return { vehicle: await loadVehicleDetailForUser(row.id, userId) }
  })

const COVER_FROM_MODEL_NAME = '3D studio cover'

export const addVehicleCoverFromModel = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; dataUrl: string }) => {
    const dataUrl = data.dataUrl.trim()
    if (!dataUrl.startsWith('data:image/jpeg') && !dataUrl.startsWith('data:image/png')) {
      throw new Error('Invalid cover image')
    }
    if (dataUrl.length > MAX_ASSET_CHARS) {
      throw new Error('Generated image is too large')
    }
    return { id: data.id, dataUrl }
  })
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const detail = await loadVehicleDetailForUser(data.id, userId)

    const modelAsset = detail.assets.find(
      (asset) => asset.id === detail.modelAssetId && asset.kind === 'model',
    )
    if (!modelAsset) {
      throw new Error('Upload a 3D model before generating a cover photo')
    }

    const withoutPrevious = detail.assets.filter(
      (asset) => !(asset.kind === 'image' && asset.name === COVER_FROM_MODEL_NAME),
    )
    const imageCount = withoutPrevious.filter((asset) => asset.kind === 'image').length
    if (imageCount >= MAX_ASSETS) {
      throw new Error('Photo limit reached. Remove a photo first.')
    }

    const coverAsset: VehicleAsset = {
      id: randomUUID(),
      kind: 'image',
      name: COVER_FROM_MODEL_NAME,
      mime: 'image/jpeg',
      src: data.dataUrl,
      createdAt: new Date().toISOString(),
    }

    const values = normalizeVehicleInput({
      ...vehicleToInput(detail),
      assets: [...withoutPrevious, coverAsset],
      imageUrl: coverAsset.src,
    })

    const [row] = await db
      .update(vehicles)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(vehicles.id, data.id), eq(vehicles.userId, userId)))
      .returning()

    if (!row) throw new Error('Vehicle not found')

    return { vehicle: await loadVehicleDetailForUser(row.id, userId) }
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
