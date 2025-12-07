import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

/**
 * Singleton de conexión a PostgreSQL con Drizzle ORM
 * Garantiza una única instancia de conexión en toda la aplicación
 */

let db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not defined in environment variables. Please check your .env file.'
      )
    }

    // Crear cliente PostgreSQL con configuración de pool
    const client = postgres(connectionString, {
      max: 10, // Máximo de conexiones en el pool
      idle_timeout: 20, // Tiempo de inactividad antes de cerrar conexión (segundos)
      connect_timeout: 10 // Timeout para establecer conexión (segundos)
    })

    // Crear instancia de Drizzle con los schemas
    db = drizzle(client, { schema })

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Database connection established')
    }
  }

  return db
}

// Exportar schemas para uso directo
export * from './schema'
// export * from './types' // Descomentar cuando se necesiten los tipos
