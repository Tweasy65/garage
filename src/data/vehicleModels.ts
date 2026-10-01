import type { VehicleAsset } from '@/lib/vehicleTypes'

export type VehicleModelSpec = {
  id: string
  year: number
  make: string
  model: string
  bodyStyle?: string
  src: string
  hood: string
  trunk: string
  doorL: string
  doorR: string
}

export const VEHICLE_MODELS: VehicleModelSpec[] = [
  {
    id: '1965-ford-mustang-coupe',
    year: 1965,
    make: 'Ford',
    model: 'Mustang',
    bodyStyle: 'Coupe',
    src: '/models/1965-ford-mustang-coupe.glb',
    hood: 'Paint_Hood',
    trunk: 'Paint_Trunk',
    doorL: 'Paint_Door_L',
    doorR: 'Paint_Door_R',
  },
  {
    id: '2009-ford-f150',
    year: 2009,
    make: 'Ford',
    model: 'F-150',
    src: '/models/2009-ford-f150.glb',
    hood: 'Paint_Hood',
    trunk: 'Paint_Trunk',
    doorL: 'Paint_Door_L',
    doorR: 'Paint_Door_R',
  },
  {
    id: '2010-ford-f250-super-duty',
    year: 2010,
    make: 'Ford',
    model: 'F-250',
    src: '/models/2010-ford-f250-super-duty.glb',
    hood: 'Paint_Hood',
    trunk: 'Paint_Trunk',
    doorL: 'Paint_Door_L',
    doorR: 'Paint_Door_R',
  },
  {
    id: '1995-jeep-cherokee-xj',
    year: 1995,
    make: 'Jeep',
    model: 'Cherokee',
    src: '/models/1995-jeep-cherokee-xj.glb',
    hood: 'Paint_Hood',
    trunk: 'Paint_Trunk',
    doorL: 'Paint_Door_L',
    doorR: 'Paint_Door_R',
  },
  {
    id: '2022-kia-telluride',
    year: 2022,
    make: 'Kia',
    model: 'Telluride',
    src: '/models/2022-kia-telluride.glb',
    hood: 'Paint_Hood',
    trunk: 'Paint_Trunk',
    doorL: 'Paint_Door_L',
    doorR: 'Paint_Door_R',
  },
]

const NAMED_COLORS: Record<string, string> = {
  red: '#9e0b0f',
  'rangoon red': '#9e0b0f',
  'poppy red': '#b51218',
  white: '#f3eee4',
  'wimbledon white': '#f4f0e6',
  black: '#161616',
  blue: '#1c3f6e',
  silver: '#c4c7cc',
  gray: '#6d7178',
  grey: '#6d7178',
  green: '#1f4a2c',
  yellow: '#d4a017',
  orange: '#c45c12',
  gold: '#b08a3c',
}

type VehicleMatch = {
  year: number
  make: string
  model: string
  bodyStyle?: string | null
  assets?: VehicleAsset[]
  modelAssetId?: string | null
}

export const FEATURED_MODEL = VEHICLE_MODELS[0]

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ')
}

export function specFromAsset(
  vehicle: Pick<VehicleMatch, 'year' | 'make' | 'model'>,
  asset: VehicleAsset,
): VehicleModelSpec {
  return {
    id: asset.id,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    src: asset.src,
    hood: 'Paint_Hood',
    trunk: 'Paint_Trunk',
    doorL: 'Paint_Door_L',
    doorR: 'Paint_Door_R',
  }
}

export function specForVehicle(vehicle: VehicleMatch): VehicleModelSpec | null {
  const custom = vehicle.assets?.find(
    (asset) => asset.kind === 'model' && asset.id === vehicle.modelAssetId,
  )
  if (custom?.src) return specFromAsset(vehicle, custom)
  return modelForVehicle(vehicle)
}

export function modelForVehicle(vehicle: VehicleMatch): VehicleModelSpec | null {
  const make = normalize(vehicle.make)
  const model = normalize(vehicle.model)
  const body = vehicle.bodyStyle ? normalize(vehicle.bodyStyle) : ''
  return (
    VEHICLE_MODELS.find((entry) => {
      if (normalize(entry.make) !== make) return false
      if (normalize(entry.model) !== model) return false
      if (entry.bodyStyle && body && normalize(entry.bodyStyle) !== body) {
        return false
      }
      return true
    }) ?? null
  )
}

export function catalogModelLabel(spec: VehicleModelSpec): string {
  const body = spec.bodyStyle ? ` ${spec.bodyStyle}` : ''
  return `${spec.year} ${spec.make} ${spec.model}${body}`
}

export function catalogModelToAsset(spec: VehicleModelSpec): VehicleAsset {
  return {
    id: spec.id,
    kind: 'model',
    name: catalogModelLabel(spec),
    mime: 'model/gltf-binary',
    src: spec.src,
    createdAt: new Date().toISOString(),
  }
}

export function paintColorFromName(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  return NAMED_COLORS[trimmed.toLowerCase()] ?? null
}
