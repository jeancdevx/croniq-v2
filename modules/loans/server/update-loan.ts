'use server'

import { revalidatePath } from 'next/cache'

import { format } from 'date-fns'
import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cuota, prestamo } from '@/db/schema'

import {
  calculateFirstDueDate,
  generateAmortizationSchedule
} from '../lib/amortization'
import {
  calculateTCEAMonthly,
  calculateTEM,
  roundToFour,
  roundToSix,
  roundToTwo
} from '../lib/financial-calcs'
import { updateLoanSchema } from '../schemas'

interface UpdateLoanResult {
  success: boolean
  data?: {
    prestamoId: string
    message: string
  }
  error?: string
}

export async function updateLoan(
  prestamoId: string,
  formData: FormData
): Promise<UpdateLoanResult> {
  try {
    const db = getDb()

    // 1. Verificar que el préstamo existe y está en DRAFT
    const [existingLoan] = await db
      .select()
      .from(prestamo)
      .where(eq(prestamo.id, prestamoId))
      .limit(1)

    if (!existingLoan) {
      return {
        success: false,
        error: 'Préstamo no encontrado'
      }
    }

    if (existingLoan.estado !== 'DRAFT') {
      return {
        success: false,
        error: 'Solo se pueden editar préstamos en estado DRAFT'
      }
    }

    // 2. Validar datos de entrada
    const rawData = {
      numeroCuotas: Number(formData.get('numeroCuotas')),
      fechaDesembolso: formData.get('fechaDesembolso'),
      monedaPago: formData.get('monedaPago')
    }

    const validatedData = updateLoanSchema.parse(rawData)

    // Calcular día de vencimiento automáticamente desde la fecha de desembolso
    // IMPORTANTE: Agregar T12:00:00 para evitar que JavaScript interprete como UTC midnight
    const fechaDesembolso = new Date(
      validatedData.fechaDesembolso + 'T12:00:00'
    )
    const diaVencimiento = fechaDesembolso.getDate()

    // 3. Calcular valores financieros (usar datos del préstamo original)
    const teaDecimal = parseFloat(existingLoan.tea)
    const tem = roundToSix(calculateTEM(teaDecimal))
    const montoSolicitado = parseFloat(existingLoan.montoSolicitado)

    // 4. SIN comisión de desembolso
    const montoDesembolsado = montoSolicitado

    // 5. Sistema solo trabaja en SOLES (PEN)
    // No hay tipo de cambio ni conversión de moneda

    // 6. Generar nuevo cronograma EN SOLES
    const fechaPrimerVencimiento = calculateFirstDueDate(
      fechaDesembolso,
      diaVencimiento
    )

    const cronograma = generateAmortizationSchedule({
      montoSolicitado: montoSolicitado,
      tea: teaDecimal,
      numeroCuotas: validatedData.numeroCuotas,
      fechaDesembolso,
      diaVencimiento: diaVencimiento,
      tasaSeguroDesgravamen: 0.0018
    })

    // 7. Calcular totales EN SOLES (PEN)
    const totalAPagar = roundToTwo(
      cronograma.reduce((sum, c) => sum + c.totalConSeguro, 0)
    )

    // 8. Calcular TCEA usando modelo académico (períodos mensuales)
    const cuotaMensual = cronograma[0].totalConSeguro
    const tcea = roundToFour(
      calculateTCEAMonthly(
        montoDesembolsado,
        cuotaMensual,
        validatedData.numeroCuotas
      )
    )

    // 9. Actualizar préstamo
    await db
      .update(prestamo)
      .set({
        numeroCuotas: validatedData.numeroCuotas,
        monedaPago: 'PEN',
        tipoCambioDesembolso: null,
        fechaDesembolso: validatedData.fechaDesembolso,
        fechaPrimerVencimiento: format(fechaPrimerVencimiento, 'yyyy-MM-dd'),
        diaVencimiento: diaVencimiento,
        totalAPagar: totalAPagar.toString(),
        tem: tem.toString(),
        tcea: tcea.toString()
      })
      .where(eq(prestamo.id, prestamoId))

    // 11. Eliminar cuotas anteriores
    await db.delete(cuota).where(eq(cuota.prestamoId, prestamoId))

    // 12. Insertar nuevas cuotas
    const cuotasToInsert = cronograma.map(c => ({
      prestamoId: prestamoId,
      numeroCuota: c.numeroCuota,
      fechaVencimiento: format(c.fechaVencimiento, 'yyyy-MM-dd'),
      capital: c.capital.toString(),
      interes: c.interes.toString(),
      totalCuota: c.totalCuota.toString(),
      seguroDesgravamen: c.seguroDesgravamen.toString(),
      totalConSeguro: c.totalConSeguro.toString(),
      saldoRestante: c.saldoRestante.toString(),
      saldoPendiente: c.totalConSeguro.toString(), // Inicializar pendiente = total
      montoPagado: '0.00',
      montoMora: '0.00',
      diasMora: 0,
      estado: 'PENDIENTE'
    }))

    await db.insert(cuota).values(cuotasToInsert)

    // 13. Revalidar rutas
    revalidatePath('/loans')
    revalidatePath(`/loans/${prestamoId}`)

    return {
      success: true,
      data: {
        prestamoId: prestamoId,
        message: 'Préstamo actualizado exitosamente'
      }
    }
  } catch (error) {
    console.error('Error updating loan:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: false,
      error: 'Error al actualizar el préstamo'
    }
  }
}
