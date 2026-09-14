import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Clerk user id — owner of this vehicle record */
    userId: text('user_id').notNull(),
    make: text('make').notNull(),
    model: text('model').notNull(),
    trim: text('trim'),
    year: integer('year').notNull(),
    color: text('color'),
    vin: text('vin'),
    licensePlate: text('license_plate'),
    mileage: integer('mileage').notNull().default(0),
    purchaseDate: timestamp('purchase_date', { withTimezone: true }),
    notes: text('notes'),
    isProject: boolean('is_project').notNull().default(false),
    isFavorite: boolean('is_favorite').notNull().default(false),
    bodyStyle: text('body_style'),
    transmission: text('transmission'),
    fuelType: text('fuel_type'),
    drivetrain: text('drivetrain'),
    engineType: text('engine_type'),
    engineSize: text('engine_size'),
    seatingCapacity: integer('seating_capacity'),
    mpgCity: integer('mpg_city'),
    mpgHighway: integer('mpg_highway'),
    titleStatus: text('title_status'),
    imageUrl: text('image_url'),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('vehicles_user_idx').on(t.userId),
    index('vehicles_user_favorite_idx').on(t.userId, t.isFavorite),
  ],
)

export const maintenanceRecords = pgTable(
  'maintenance_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    date: timestamp('date', { withTimezone: true }).notNull(),
    type: text('type').notNull(),
    description: text('description'),
    costCents: integer('cost_cents'),
    mileage: integer('mileage'),
    serviceProvider: text('service_provider'),
    nextDueDate: timestamp('next_due_date', { withTimezone: true }),
    nextDueMileage: integer('next_due_mileage'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('maintenance_vehicle_idx').on(t.vehicleId),
    index('maintenance_user_idx').on(t.userId),
  ],
)

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  maintenance: many(maintenanceRecords),
}))

export const maintenanceRecordsRelations = relations(
  maintenanceRecords,
  ({ one }) => ({
    vehicle: one(vehicles, {
      fields: [maintenanceRecords.vehicleId],
      references: [vehicles.id],
    }),
  }),
)
