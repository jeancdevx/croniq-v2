import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

import { processLoanPayment } from '@/proxy/payments/actions'
import {
  getFlowOrderStatus,
  getPaymentMethodName
} from '@/proxy/payments/flow-service'
import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { pagoFlow } from '@/db/schema/pago-flow.schema'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const token = formData.get('token') as string

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Consultar estado en Flow para validar la transacción
    const status = await getFlowOrderStatus(token)

    console.log('Webhook Flow Recibido:', status)

    // Actualizar estado en la BD
    const db = getDb()
    if (db && status.commerceOrder) {
      let nuevoEstado = 'PENDIENTE'
      if (status.status === 2) nuevoEstado = 'PAGADO' // 2 = Pagada
      if (status.status === 3 || status.status === 4) nuevoEstado = 'RECHAZADO'

      // Check current status to avoid double processing
      const existingPayment = await db.query.pagoFlow.findFirst({
        where: eq(pagoFlow.flowOrder, status.commerceOrder)
      })

      // Extract media from paymentData if available, otherwise fallback
      const mediaRaw =
        status.paymentData?.media || status.pending_info?.media || status.media

      if (existingPayment) {
        // If transitioning to PAGADO for the first time
        if (existingPayment.estado !== 'PAGADO' && nuevoEstado === 'PAGADO') {
          await db
            .update(pagoFlow)
            .set({
              estado: 'PAGADO',
              fechaPago: new Date(),
              medioPago: getPaymentMethodName(mediaRaw) // Guardar el medio de pago mapeado
            })
            .where(eq(pagoFlow.flowOrder, status.commerceOrder))

          // Process Loan Payment Logic
          if (existingPayment.prestamoId && existingPayment.montoBase) {
            console.log(
              `Processing loan payment for loan ${existingPayment.prestamoId}`
            )
            await processLoanPayment(
              existingPayment.prestamoId,
              Number(existingPayment.montoBase),
              existingPayment.id
            )
          }

          // Crear movimiento de caja con comisión Flow
          try {
            const { calcularComisionFlow, determinarMedioPagoFlow } =
              await import('@/modules/caja/lib/calcular-comision-flow')
            const { crearMovimientoCaja } =
              await import('@/modules/caja/server')

            const medioPago = determinarMedioPagoFlow(mediaRaw || 'TARJETA')
            const montoBruto = Number(existingPayment.monto)
            const { montoNeto, comisionTotal } = calcularComisionFlow(
              montoBruto,
              medioPago
            )

            await crearMovimientoCaja({
              tipo: 'INGRESO',
              categoria: 'PAGO_FLOW',
              monto: montoNeto,
              montoBruto,
              comisionFlow: comisionTotal,
              medioPagoFlow: medioPago,
              pagoFlowId: existingPayment.id,
              descripcion: `Pago Flow - ${status.commerceOrder}`
            })

            console.log(
              `✅ Movimiento caja: S/ ${montoNeto} (Bruto: S/ ${montoBruto}, Comisión: S/ ${comisionTotal})`
            )
          } catch (cajaError) {
            console.warn(
              '⚠️ No se pudo registrar movimiento de caja:',
              cajaError
            )
            // No fallar el webhook si falla el registro de caja
          }
        } else {
          // Just update status if not already paid
          if (existingPayment.estado !== 'PAGADO') {
            await db
              .update(pagoFlow)
              .set({
                estado: nuevoEstado,
                fechaPago: nuevoEstado === 'PAGADO' ? new Date() : null,
                medioPago: mediaRaw
                  ? getPaymentMethodName(mediaRaw)
                  : existingPayment.medioPago
              })
              .where(eq(pagoFlow.flowOrder, status.commerceOrder))
          }
        }
      }

      // Trigger revalidation for the payments list
      revalidatePath('/payments')
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
