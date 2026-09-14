import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'

import { workerEnv } from '@/lib/workerEnv'
import * as schema from './schema'

export type AppDatabase = NeonHttpDatabase<typeof schema>

function createDb(): AppDatabase {
  const url = workerEnv('DATABASE_URL')
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add your Neon connection string to .env.local or set a Worker secret.',
    )
  }
  return drizzle(neon(url), { schema })
}

export function getDb(): AppDatabase {
  return createDb()
}

export const db = new Proxy({} as AppDatabase, {
  get(_target, prop) {
    const d = getDb()
    const value = Reflect.get(d, prop, d)
    return typeof value === 'function' ? value.bind(d) : value
  },
})
