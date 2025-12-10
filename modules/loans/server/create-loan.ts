'use server'

import { revalidatePath } from 'next/cache'

import { format } from 'date-fns'

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

    // 4. SIN comisión de desembolso (según SBS Perú 2025)
    // Monto solicitado = Monto desembolsado
    const montoDesembolsado = validatedData.montoSolicitado

    // 5. Sistema solo trabaja en SOLES (PEN)
    // No hay tipo de cambio ni conversión de moneda

    // 6. Generar cronograma EN SOLES
    // IMPORTANTE: Agregar T12:00:00 para evitar que JavaScript interprete como UTC midnight
    // lo cual restaría un día en Perú (UTC-5)
    const fechaDesembolso = new Date(
      validatedData.fechaDesembolso + 'T12:00:00'
    )
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

    // 7. Calcular totales EN SOLES (PEN)
    const totalAPagar = roundToTwo(
      cronograma.reduce((sum, c) => sum + c.totalConSeguro, 0)
    )

    // 8. Calcular TCEA usando modelo académico (períodos mensuales)
    // Cuota mensual fija × n cuotas (todas las cuotas son iguales)
    const cuotaMensual = cronograma[0].totalConSeguro
    const tcea = roundToFour(
      calculateTCEAMonthly(
        montoDesembolsado,
        cuotaMensual,
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
        comisionDesembolso: '0.00',
        porcentajeComisionDesembolso: '0.00',
        numeroCuotas: validatedData.numeroCuotas,
        frecuencia: 'MENSUAL',
        monedaPrestamo: 'PEN',
        monedaPago: 'PEN',
        tipoCambioDesembolso: null,
        fechaDesembolso: validatedData.fechaDesembolso,
        fechaPrimerVencimiento: format(fechaPrimerVencimiento, 'yyyy-MM-dd'),
        diaVencimiento: validatedData.diaVencimiento,
        estado: 'DRAFT'
      })
      .returning()

    // 9. Insertar cuotas
    const cuotasToInsert = cronograma.map(c => ({
      prestamoId: newLoan.id,
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
