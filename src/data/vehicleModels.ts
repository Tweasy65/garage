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
}

export const FEATURED_MODEL = VEHICLE_MODELS[0]

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ')
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

export function paintColorFromName(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  return NAMED_COLORS[trimmed.toLowerCase()] ?? null
}
