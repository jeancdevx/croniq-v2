import { desc } from 'drizzle-orm'

import { getDb } from '@/db'
import { cliente } from '@/db/schema'
import type { Cliente } from '@/db/types'

export async function getAllClients(): Promise<Cliente[]> {
  try {
    const db = getDb()
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
