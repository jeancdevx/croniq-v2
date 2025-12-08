import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not defined in environment variables. Please check your .env file.'
      )
    }

    const client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10
    })

    db = drizzle(client, { schema })

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Database connection established')
    }
  }

  return db
}

export * from './schema'
export * from './types'
