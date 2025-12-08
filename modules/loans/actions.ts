'use server'

import { revalidatePath } from 'next/cache'

import { getDb } from '@/db'
import { cuota, prestamo } from '@/db/schema'

import { calcularCronogramaDetallado } from '@/modules/loans/utils/loan-calculations'

interface CreateLoanParams {
  clienteId: string
  monto: number
  plazo: number
  tasaAnual: number
  fechaDesembolso: string
}

export async function createLoan(params: CreateLoanParams) {
  try {
    const { clienteId, monto, plazo, tasaAnual, fechaDesembolso } = params
    const db = getDb()

    // Calculate detailed schedule
    const cronograma = calcularCronogramaDetallado(
      monto,
      tasaAnual,
      plazo,
      fechaDesembolso
    )

    await db.transaction(async tx => {
      // Create loan
      const [newLoan] = await tx
        .insert(prestamo)
        .values({
          clienteId,
          montoSolicitado: monto.toString(),
          tasaInteres: tasaAnual.toString(),
          numeroCuotas: plazo,
          frecuencia: 'MENSUAL',
          moneda: 'PEN',
          fechaDesembolso: fechaDesembolso,
          estado: 'ACTIVO'
        })
        .returning()

      // Create installments
      await tx.insert(cuota).values(
        cronograma.map(c => ({
          prestamoId: newLoan.id,
          numeroCuota: c.numeroCuota,
          fechaVencimiento: c.fechaVencimiento,
          totalCuota: c.totalCuota.toString(),
          capital: c.capital.toString(),
          interes: c.interes.toString(),
          saldoRestante: c.saldoRestante.toString(),
          estado: 'PENDIENTE'
        }))
      )
    })

    revalidatePath('/prestamos')
    return { success: true }
  } catch (error) {
    console.error('Error creating loan:', error)
    return { success: false, error: 'Error al crear el préstamo' }
  }
}
