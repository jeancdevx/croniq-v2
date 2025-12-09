'use server'

import { revalidatePath } from 'next/cache'

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
import { createLoanSchema } from '../schemas'
import { validateLoanRules } from './validate-loan-rules'

interface CreateLoanResult {
  success: boolean
  data?: {
    prestamoId: string
    message: string
  }
  error?: string
}

export async function createLoan(
  formData: FormData
): Promise<CreateLoanResult> {
  try {
    // 1. Extraer y validar datos
    const rawData = {
      clienteId: formData.get('clienteId'),
      montoSolicitado: Number(formData.get('montoSolicitado')),
      tea: Number(formData.get('tea')),
      numeroCuotas: Number(formData.get('numeroCuotas')),
      monedaPrestamo: formData.get('monedaPrestamo'),
      monedaPago: formData.get('monedaPago'),
      fechaDesembolso: formData.get('fechaDesembolso'),
      diaVencimiento: Number(formData.get('diaVencimiento'))
    }

    const validatedData = createLoanSchema.parse(rawData)

    // 2. Validar reglas de negocio
    const validation = await validateLoanRules(
      validatedData.clienteId,
      validatedData.montoSolicitado
    )

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // 3. Calcular valores financieros EN LA MONEDA DEL PRÉSTAMO
    const teaDecimal = validatedData.tea
    const tem = roundToSix(calculateTEM(teaDecimal))

    // 4. Calcular comisión EN LA MONEDA DEL PRÉSTAMO (antes de convertir)
    const comisionDesembolso = roundToTwo(
      calculateDisbursementFee(validatedData.montoSolicitado, 0.02)
    )
    const montoDesembolsado = roundToTwo(
      validatedData.montoSolicitado - comisionDesembolso
    )

    // 5. Obtener tipo de cambio si las monedas son diferentes
    let tipoCambioDesembolso: number | null = null

    if (validatedData.monedaPrestamo !== validatedData.monedaPago) {
      const fechaStr = new Date(validatedData.fechaDesembolso)
        .toISOString()
        .split('T')[0]

      const exchangeRateResult = await getExchangeRate(fechaStr)

      if (!exchangeRateResult.success) {
        return {
          success: false,
          error: 'No se pudo obtener el tipo de cambio. Intente nuevamente.'
        }
      }

      // Ya incluye el 2% de margen
      tipoCambioDesembolso = roundToFour(exchangeRateResult.data.venta)
    }

    // 6. Generar cronograma EN LA MONEDA DEL PRÉSTAMO (USD)
    // La deuda "vive" en USD, el sistema francés opera en USD
    const fechaDesembolso = new Date(validatedData.fechaDesembolso)
    const fechaPrimerVencimiento = calculateFirstDueDate(
      fechaDesembolso,
      validatedData.diaVencimiento
    )

    const cronograma = generateAmortizationSchedule({
      montoSolicitado: validatedData.montoSolicitado, // Usa el monto ORIGINAL en USD
      tea: teaDecimal,
      numeroCuotas: validatedData.numeroCuotas,
      fechaDesembolso,
      diaVencimiento: validatedData.diaVencimiento,
      tasaSeguroDesgravamen: 0.0018
    })

    // 7. Calcular totales EN LA MONEDA DEL PRÉSTAMO
    const totalAPagarEnMonedaPrestamo = roundToTwo(
      cronograma.reduce((sum, c) => sum + c.totalConSeguro, 0)
    )

    // 8. Si paga en moneda diferente, convertir el total para mostrar
    const totalAPagar =
      validatedData.monedaPrestamo !== validatedData.monedaPago &&
      tipoCambioDesembolso
        ? roundToTwo(
            validatedData.monedaPrestamo === 'USD'
              ? totalAPagarEnMonedaPrestamo * tipoCambioDesembolso
              : totalAPagarEnMonedaPrestamo / tipoCambioDesembolso
          )
        : totalAPagarEnMonedaPrestamo

    // 9. Calcular TCEA EN LA MONEDA DEL PRÉSTAMO (USD)
    // IMPORTANTE: TCEA compara lo que RECIBES vs lo que PAGAS en la MISMA moneda
    const tcea = roundToFour(
      calculateTCEA(
        montoDesembolsado, // USD 9,800 (lo que recibe)
        cronograma.map(c => c.totalConSeguro), // Cuotas en USD
        validatedData.numeroCuotas
      )
    )

    // 8. Insertar préstamo en la base de datos
    const db = getDb()

    const [newLoan] = await db
      .insert(prestamo)
      .values({
        clienteId: validatedData.clienteId,
        montoSolicitado: validatedData.montoSolicitado.toString(),
        montoDesembolsado: montoDesembolsado.toString(),
        totalAPagar: totalAPagar.toString(),
        tea: teaDecimal.toString(),
        tem: tem.toString(),
        tcea: tcea.toString(),
        tasaMora: '1.00',
        tasaSeguroDesgravamen: '0.18',
        comisionDesembolso: comisionDesembolso.toString(),
        porcentajeComisionDesembolso: '2.00',
        numeroCuotas: validatedData.numeroCuotas,
        frecuencia: 'MENSUAL',
        monedaPrestamo: validatedData.monedaPrestamo,
        monedaPago: validatedData.monedaPago,
        tipoCambioDesembolso: tipoCambioDesembolso?.toString() || null,
        fechaDesembolso: validatedData.fechaDesembolso,
        fechaPrimerVencimiento: fechaPrimerVencimiento
          .toISOString()
          .split('T')[0],
        diaVencimiento: validatedData.diaVencimiento,
        estado: 'DRAFT'
      })
      .returning()

    // 9. Insertar cuotas
    const cuotasToInsert = cronograma.map(c => ({
      prestamoId: newLoan.id,
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

    // 10. Revalidar rutas
    revalidatePath('/loans')
    revalidatePath('/clients')

    return {
      success: true,
      data: {
        prestamoId: newLoan.id,
        message:
          'Préstamo creado como borrador. Revisa los detalles para confirmar.'
      }
    }
  } catch (error) {
    console.error('Error creating loan:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: false,
      error: 'Error al crear el préstamo'
    }
  }
}
