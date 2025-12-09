'use server'

import { revalidatePath } from 'next/cache'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cuota, prestamo } from '@/db/schema'
import { getExchangeRate } from '@/lib/exchange-rate'

import {
  calculateFirstDueDate,
  generateAmortizationSchedule
} from '../lib/amortization'
import {
  calculateDisbursementFee,
  calculateTCEA,
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
    const fechaDesembolso = new Date(validatedData.fechaDesembolso)
    const diaVencimiento = fechaDesembolso.getDate()

    // 3. Calcular valores financieros (usar datos del préstamo original)
    const teaDecimal = parseFloat(existingLoan.tea)
    const tem = roundToSix(calculateTEM(teaDecimal))
    const montoSolicitado = parseFloat(existingLoan.montoSolicitado)

    // 4. Calcular comisión EN LA MONEDA DEL PRÉSTAMO
    const comisionDesembolso = roundToTwo(
      calculateDisbursementFee(montoSolicitado, 0.02)
    )
    const montoDesembolsado = roundToTwo(montoSolicitado - comisionDesembolso)

    // 5. Obtener tipo de cambio si cambiaron las monedas
    let tipoCambioDesembolso: number | null = null

    if (existingLoan.monedaPrestamo !== validatedData.monedaPago) {
      const hoy = new Date()
      const year = hoy.getFullYear()
      const month = String(hoy.getMonth() + 1).padStart(2, '0')
      const day = String(hoy.getDate()).padStart(2, '0')
      const fechaStr = `${year}-${month}-${day}`

      console.log('Fetching exchange rate for TODAY:', fechaStr)

      const exchangeRateResult = await getExchangeRate(fechaStr)

      if (!exchangeRateResult.success) {
        return {
          success: false,
          error: 'No se pudo obtener el tipo de cambio. Intente nuevamente.'
        }
      }

      tipoCambioDesembolso = roundToFour(exchangeRateResult.data.venta)
    }

    // 6. Generar nuevo cronograma EN LA MONEDA DEL PRÉSTAMO
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

    // 7. Calcular totales
    const totalAPagarEnMonedaPrestamo = roundToTwo(
      cronograma.reduce((sum, c) => sum + c.totalConSeguro, 0)
    )

    // 8. Si paga en moneda diferente, convertir el total
    const totalAPagar =
      existingLoan.monedaPrestamo !== validatedData.monedaPago &&
      tipoCambioDesembolso
        ? roundToTwo(
            existingLoan.monedaPrestamo === 'USD'
              ? totalAPagarEnMonedaPrestamo * tipoCambioDesembolso
              : totalAPagarEnMonedaPrestamo / tipoCambioDesembolso
          )
        : totalAPagarEnMonedaPrestamo

    // 9. Calcular TCEA
    const tcea = roundToFour(
      calculateTCEA(
        montoDesembolsado,
        cronograma.map(c => c.totalConSeguro),
        validatedData.numeroCuotas
      )
    )

    // 10. Actualizar préstamo
    await db
      .update(prestamo)
      .set({
        numeroCuotas: validatedData.numeroCuotas,
        monedaPago: validatedData.monedaPago,
        tipoCambioDesembolso: tipoCambioDesembolso?.toString() || null,
        fechaDesembolso: validatedData.fechaDesembolso,
        fechaPrimerVencimiento: fechaPrimerVencimiento
          .toISOString()
          .split('T')[0],
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
      fechaVencimiento: c.fechaVencimiento.toISOString().split('T')[0],
      capital: c.capital.toString(),
      interes: c.interes.toString(),
      totalCuota: c.totalCuota.toString(),
      seguroDesgravamen: c.seguroDesgravamen.toString(),
      totalConSeguro: c.totalConSeguro.toString(),
      saldoRestante: c.saldoRestante.toString(),
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
