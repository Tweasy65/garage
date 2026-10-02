export type VehicleAssetKind = 'image' | 'model'

export type VehicleAsset = {
  id: string
  kind: VehicleAssetKind
  name: string
  mime: string
  src: string
  createdAt: string
}

export type VehicleInput = {
  make: string
  model: string
  trim?: string | null
  year: number
  color?: string | null
  vin?: string | null
  licensePlate?: string | null
  mileage: number
  purchaseDate?: string | null
  notes?: string | null
  isProject?: boolean
  isFavorite?: boolean
  bodyStyle?: string | null
  transmission?: string | null
  fuelType?: string | null
  drivetrain?: string | null
  engineType?: string | null
  engineSize?: string | null
  seatingCapacity?: number | null
  mpgCity?: number | null
  mpgHighway?: number | null
  titleStatus?: string | null
  imageUrl?: string | null
  assets?: VehicleAsset[]
  modelAssetId?: string | null
  tags?: string[]
}

export type MaintenanceInput = {
  vehicleId: string
  date: string
  type: string
  description?: string | null
  costCents?: number | null
  mileage?: number | null
  serviceProvider?: string | null
  nextDueDate?: string | null
  nextDueMileage?: number | null
}

export type VehicleSummary = {
  id: string
  make: string
  model: string
  trim: string | null
  year: number
  color: string | null
  mileage: number
  isProject: boolean
  isFavorite: boolean
  imageUrl: string | null
  tags: string[]
  maintenanceCount: number
}

export type StockImage = {
  url: string
  thumbUrl: string
  title: string
  source: string
}

export type VehicleDetail = VehicleSummary & {
  vin: string | null
  licensePlate: string | null
  purchaseDate: string | null
  notes: string | null
  bodyStyle: string | null
  transmission: string | null
  fuelType: string | null
  drivetrain: string | null
  engineType: string | null
  engineSize: string | null
  seatingCapacity: number | null
  mpgCity: number | null
  mpgHighway: number | null
  titleStatus: string | null
  assets: VehicleAsset[]
  modelAssetId: string | null
  maintenance: MaintenanceRecord[]
  projectItems: ProjectItem[]
}

export type ProjectArea =
  | 'engine'
  | 'body'
  | 'interior'
  | 'electrical'
  | 'misc'

export type ProjectItem = {
  id: string
  vehicleId: string
  title: string
  notes: string | null
  instructionsMd: string | null
  area: ProjectArea
  done: boolean
  completedAt: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type ProjectItemInput = {
  vehicleId: string
  title: string
  notes?: string | null
  area: ProjectArea
}

export type ProjectBoard = {
  vehicle: VehicleSummary
  items: ProjectItem[]
}

export type MaintenanceRecord = {
  id: string
  vehicleId: string
  date: string
  type: string
  description: string | null
  costCents: number | null
  mileage: number | null
  serviceProvider: string | null
  nextDueDate: string | null
  nextDueMileage: number | null
}

export type ServiceRecord = MaintenanceRecord & {
  vehicleLabel: string
}
