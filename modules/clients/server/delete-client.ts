'use server'

import { revalidatePath } from 'next/cache'

import { and, eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cliente, prestamo } from '@/db/schema'

export const deleteClient = async (id: string) => {
  try {
    const db = getDb()

    // Check for active loans
    const activeLoans = await db
      .select()
      .from(prestamo)
      .where(and(eq(prestamo.clienteId, id), eq(prestamo.estado, 'ACTIVO')))
      .limit(1)

    if (activeLoans.length > 0) {
      return {
        success: false,
        error: 'No se puede eliminar el cliente porque tiene un préstamo activo'
      }
    }

    // Try to delete the client
    // Note: This might fail if there are non-active loans due to FK constraints
    await db.delete(cliente).where(eq(cliente.id, id))

    revalidatePath('/clients')

    return {
      success: true,
      message: 'Cliente eliminado exitosamente'
    }
  } catch (error: unknown) {
    console.error('Error deleting client:', error)

    // Handle foreign key constraint violation (Postgres error code 23503)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === '23503'
    ) {
      return {
        success: false,
        error:
          'No se puede eliminar el cliente porque tiene registros asociados (historial de préstamos)'
      }
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: false,
      error: 'Error al eliminar el cliente'
    }
  }
}
