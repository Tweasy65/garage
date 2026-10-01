import { formatDate } from '@/lib/format'
import type { VehicleDetail } from '@/lib/vehicleTypes'

export type VehicleSpecSectionId = 'identity' | 'powertrain' | 'efficiency'

export type VehicleSpecSection = {
  id: VehicleSpecSectionId
  title: string
  emptyHint: string
  rows: [string, string][]
}

function rowsWithValues(
  rows: [string, string | null | undefined][],
): [string, string][] {
  return rows.filter((row) => Boolean(row[1])) as [string, string][]
}

export function buildVehicleSpecSections(vehicle: VehicleDetail): VehicleSpecSection[] {
  const definitions: {
    id: VehicleSpecSectionId
    title: string
    emptyHint: string
    raw: [string, string | null | undefined][]
  }[] = [
    {
      id: 'identity',
      title: 'Identity',
      emptyHint: 'Add VIN, plates, and title info in edit vehicle.',
      raw: [
        ['VIN', vehicle.vin],
        ['License plate', vehicle.licensePlate],
        ['Title status', vehicle.titleStatus],
        ['Purchase date', formatDate(vehicle.purchaseDate)],
      ],
    },
    {
      id: 'powertrain',
      title: 'Powertrain',
      emptyHint: 'Add body style, engine, and drivetrain in edit vehicle.',
      raw: [
        ['Body style', vehicle.bodyStyle],
        [
          'Engine',
          [vehicle.engineType, vehicle.engineSize].filter(Boolean).join(' ') || null,
        ],
        ['Transmission', vehicle.transmission],
        ['Fuel type', vehicle.fuelType],
        ['Drivetrain', vehicle.drivetrain],
      ],
    },
    {
      id: 'efficiency',
      title: 'Efficiency',
      emptyHint: 'Add MPG and seating capacity in edit vehicle.',
      raw: [
        [
          'MPG',
          vehicle.mpgCity != null && vehicle.mpgHighway != null
            ? `${vehicle.mpgCity} city / ${vehicle.mpgHighway} hwy`
            : null,
        ],
        [
          'Seating',
          vehicle.seatingCapacity != null ? String(vehicle.seatingCapacity) : null,
        ],
      ],
    },
  ]

  return definitions.map(({ raw, ...section }) => ({
    ...section,
    rows: rowsWithValues(raw),
  }))
}

export function firstSpecSectionWithData(
  sections: VehicleSpecSection[],
): VehicleSpecSectionId {
  return sections.find((section) => section.rows.length > 0)?.id ?? 'identity'
}
