import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { prestamo } from '@/db/schema'
import type { PrestamoConCuotas } from '@/db/types'

export async function getLoanById(
  id: string
): Promise<PrestamoConCuotas | null> {
  try {
    const db = getDb()

    const loan = await db.query.prestamo.findFirst({
      where: eq(prestamo.id, id),
      with: {
        cliente: true,
        cuotas: {
          orderBy: (cuotas, { asc }) => [asc(cuotas.numeroCuota)]
        }
      }
    })

    return (loan as PrestamoConCuotas) || null
  } catch (error) {
    console.error('Error fetching loan:', error)
    return null
  }
}
