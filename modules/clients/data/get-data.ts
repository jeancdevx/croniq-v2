import { desc } from 'drizzle-orm'

import { getDb } from '@/lib/db'
import { cliente } from '@/lib/db/schema/cliente.schema'
import { Cliente } from '@/lib/db/types'

export const getData = async (): Promise<Cliente[]> => {
  const db = getDb()
  if (!db) return []

  try {
    const clients = await db
      .select()
      .from(cliente)
      .orderBy(desc(cliente.createdAt))
    return clients
  } catch (error) {
    console.error('Error fetching clients:', error)
    return []
  }
}
