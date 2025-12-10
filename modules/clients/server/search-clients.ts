'use server'

import { ilike, or } from 'drizzle-orm'

import { getDb } from '@/db'
import { cliente } from '@/db/schema'
import type { Cliente } from '@/db/types'

/**
 * Busca clientes por DNI, nombre o apellido
 * @param query - Término de búsqueda (mínimo 2 caracteres)
 * @returns Array de clientes que coinciden con la búsqueda (máximo 20)
 */
export async function searchClients(query: string): Promise<Cliente[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  try {
    const db = getDb()
    const searchTerm = `%${query.trim()}%`

    const results = await db
      .select()
      .from(cliente)
      .where(
        or(
          ilike(cliente.dni, searchTerm),
          ilike(cliente.nombres, searchTerm),
          ilike(cliente.apellidos, searchTerm)
        )
      )
      .limit(20) // Limitar a 20 resultados para mejor rendimiento
      .orderBy(cliente.createdAt)

    return results
  } catch (error) {
    console.error('Error searching clients:', error)
    return []
  }
}
