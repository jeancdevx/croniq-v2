import { desc } from 'drizzle-orm'

import { getDb } from '@/db'
import { cliente } from '@/db/schema'
import { Cliente } from '@/db/types'

export const getData = async (): Promise<Cliente[]> => {
  try {
    const db = getDb()
    const clientes = await db
      .select()
      .from(cliente)
      .orderBy(desc(cliente.createdAt))
    return clientes
  } catch (error) {
    console.error('Error fetching clients:', error)
    return []
  }
}
