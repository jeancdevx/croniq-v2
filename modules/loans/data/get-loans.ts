import { desc } from 'drizzle-orm'

import { getDb } from '@/db'
import { cuota, prestamo } from '@/db/schema'
import { PrestamoConCuotas } from '@/db/types'

export const getLoans = async (): Promise<PrestamoConCuotas[]> => {
  try {
    const db = getDb()
    const loans = await db.query.prestamo.findMany({
      with: {
        cliente: true,
        cuotas: {
          orderBy: [desc(cuota.numeroCuota)]
        }
      },
      orderBy: [desc(prestamo.createdAt)]
    })

    return loans as PrestamoConCuotas[]
  } catch (error) {
    console.error('Error fetching loans:', error)
    return []
  }
}
