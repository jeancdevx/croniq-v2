'use server'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { comprobante, comprobanteDetalle } from '@/db/schema'

import { generateComprobanteHash } from '../lib/generate-hash'
import { generateQRData } from '../lib/generate-qr-data'
import { getNextComprobanteNumber } from './get-next-number'
import { getPagoFlowDetails } from './get-pago-flow-details'

interface GenerateComprobanteResult {
  success: boolean
  comprobante?: typeof comprobante.$inferSelect
  error?: string
}

/**
 * Genera un comprobante de pago (Boleta/Factura) para un pago Flow
 * Un pago Flow puede cubrir múltiples cuotas
 */
export async function generateComprobante(
  pagoFlowId: string
): Promise<GenerateComprobanteResult> {
  const db = getDb()
  if (!db) {
    return { success: false, error: 'No database connection' }
  }

  try {
    // 0. Verificar si ya existe comprobante
    const [existing] = await db
      .select()
      .from(comprobante)
      .where(eq(comprobante.pagoFlowId, pagoFlowId))
      .limit(1)

    if (existing) {
      return { success: true, comprobante: existing }
    }

    // 1. Obtener datos completos del pago
    const details = await getPagoFlowDetails(pagoFlowId)

    // 2. Validar que haya datos de empresa en .env
    const empresaRuc = process.env.EMPRESA_RUC
    if (!empresaRuc) {
      throw new Error('EMPRESA_RUC no configurado en variables de entorno')
    }

    // 3. Determinar tipo de comprobante (por ahora solo BOLETA)
    const tipoComprobante = 'BOLETA'
    const serie = 'B001'

    // 4. Obtener siguiente número
    const { numeroCompleto, numero } = await getNextComprobanteNumber(
      tipoComprobante,
      serie
    )

    // 5. Generar QR Data
    const qrData = generateQRData({
      ruc: empresaRuc,
      tipoComprobante,
      serie,
      numero,
      igv: 0, // Servicios financieros exonerados
      total: Number(details.pagoFlow.monto),
      fecha: details.pagoFlow.fechaPago || new Date(),
      tipoDocCliente: '1', // DNI
      numDocCliente: details.cliente.dni
    })

    // 6. Generar Hash
    const hash = generateComprobanteHash({
      ruc: empresaRuc,
      serie,
      numero,
      fecha: details.pagoFlow.fechaPago || new Date(),
      total: Number(details.pagoFlow.monto),
      clienteDni: details.cliente.dni
    })

    // 7. Crear registro de comprobante
    const [nuevoComprobante] = await db
      .insert(comprobante)
      .values({
        pagoFlowId: pagoFlowId,
        tipoComprobante,
        serie,
        numero,
        numeroCompleto,
        fechaEmision: details.pagoFlow.fechaPago || new Date(),
        montoTotal: details.pagoFlow.monto,
        igv: '0.00',
        hash,
        qrData,
        estado: 'EMITIDO'
      })
      .returning()

    // 8. Crear detalles (uno por cada cuota afectada)
    for (let i = 0; i < details.pagos.length; i++) {
      const { pago: pagoItem, cuota } = details.pagos[i]

      // Determinar si la cuota quedó completa o parcial
      const saldoRestante = Number(cuota.saldoPendiente || 0)
      const estadoCuota = saldoRestante > 0.01 ? 'PARCIAL' : 'COMPLETA'

      // Generar descripción
      let descripcion = `CUOTA N° ${cuota.numeroCuota}`
      if (estadoCuota === 'COMPLETA') {
        descripcion += ' (Completa)'
      } else {
        descripcion += ` (Parcial - Saldo: S/ ${saldoRestante.toFixed(2)})`
      }

      await db.insert(comprobanteDetalle).values({
        comprobanteId: nuevoComprobante.id,
        cuotaId: cuota.id,
        numeroCuota: cuota.numeroCuota,
        montoPagado: pagoItem.montoTotalRecibido,
        estadoCuota,
        saldoRestante: estadoCuota === 'PARCIAL' ? cuota.saldoPendiente : null,
        descripcion,
        orden: i + 1
      })
    }

    console.log(`Comprobante generado: ${numeroCompleto}`)

    return {
      success: true,
      comprobante: nuevoComprobante
    }
  } catch (error) {
    console.error('Error generating comprobante:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Error al generar comprobante'
    }
  }
}
