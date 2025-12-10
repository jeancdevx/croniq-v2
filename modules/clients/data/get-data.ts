import { desc, eq } from 'drizzle-orm'

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

export const getClientById = async (id: string): Promise<Cliente | null> => {
  try {
    const db = getDb()
    const [foundClient] = await db
      .select()
      .from(cliente)
      .where(eq(cliente.id, id))
      .limit(1)

    return foundClient || null
  } catch (error) {
    console.error('Error fetching client by id:', error)
    return null
  }
}
