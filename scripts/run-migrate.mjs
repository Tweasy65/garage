import { config as loadEnv } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

loadEnv({ path: path.join(root, '.env.local') })
loadEnv({ path: path.join(root, '.env') })

const url = process.env.DATABASE_URL
if (!url?.trim()) {
  console.error('DATABASE_URL is not set. Add your Neon connection string to .env.local.')
  process.exit(1)
}

const migrationsFolder = path.join(root, 'drizzle')
const pool = new pg.Pool({ connectionString: url, max: 1 })
const db = drizzle(pool)

try {
  console.error('Applying migrations from', migrationsFolder)
  await migrate(db, { migrationsFolder })
  console.error('Done.')
} catch (e) {
  console.error('Migration failed:', e)
  process.exit(1)
} finally {
  await pool.end()
}
