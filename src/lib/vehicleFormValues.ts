import type { VehicleDetail, VehicleInput } from '@/lib/vehicleTypes'

export function vehicleToInput(vehicle: VehicleDetail): VehicleInput {
  return {
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    year: vehicle.year,
    color: vehicle.color,
    mileage: vehicle.mileage,
    vin: vehicle.vin,
    licensePlate: vehicle.licensePlate,
    purchaseDate: vehicle.purchaseDate?.slice(0, 10),
    notes: vehicle.notes,
    isProject: vehicle.isProject,
    isFavorite: vehicle.isFavorite,
    bodyStyle: vehicle.bodyStyle,
    transmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    drivetrain: vehicle.drivetrain,
    engineType: vehicle.engineType,
    titleStatus: vehicle.titleStatus,
    imageUrl: vehicle.imageUrl,
    assets: vehicle.assets,
    modelAssetId: vehicle.modelAssetId,
    tags: vehicle.tags,
  }
}
