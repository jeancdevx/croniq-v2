'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

import { and, asc, desc, eq, not } from 'drizzle-orm'

import { getDb } from '@/db'
import {
  cliente,
  comprobante,
  cuota,
  pago,
  pagoFlow,
  prestamo
} from '@/db/schema'

import { generateComprobante } from '@/modules/comprobantes/server/generate-comprobante'
import { sendComprobanteWhatsApp } from '@/modules/comprobantes/server/send-comprobante-whatsapp'
import { sendWhatsappMessage } from '@/modules/notifications/server/whatsapp'

import { getFlowConfig } from './flow-config'
import { createFlowOrder } from './flow-service'

export async function getLoansByClientId(clientId: string) {
  const db = getDb()
  if (!db) return []

  try {
    const loans = await db
      .select()
      .from(prestamo)
      .where(
        and(eq(prestamo.clienteId, clientId), eq(prestamo.estado, 'ACTIVO'))
      )
      .orderBy(desc(prestamo.createdAt))

    return loans
  } catch (error) {
    console.error('Error fetching loans:', error)
    return []
  }
}

export async function getInstallmentsByLoanId(loanId: string) {
  const db = getDb()
  if (!db) return []

  try {
    const installments = await db
      .select()
      .from(cuota)
      .where(eq(cuota.prestamoId, loanId))
      .orderBy(asc(cuota.numeroCuota))

    return installments
  } catch (error) {
    console.error('Error fetching installments:', error)
    return []
  }
}

export async function getPaymentByToken(token: string) {
  const db = getDb()
  if (!db) return null

  try {
    const payment = await db.query.pagoFlow.findFirst({
      where: eq(pagoFlow.flowToken, token)
    })

    return payment
  } catch (error) {
    console.error('Error fetching payment by token:', error)
    return null
  }
}

export async function getAllPayments() {
  const db = getDb()
  if (!db) return []

  try {
    // 1. Fetch Flow Payments
    const flowPayments = await db
      .select()
      .from(pagoFlow)
      .where(not(eq(pagoFlow.estado, 'CANCELADO')))
      .orderBy(desc(pagoFlow.fechaCreacion))

    // 2. Fetch Cash Payments
    const cashPayments = await db
      .select({
        id: pago.id,
        monto: pago.montoTotalRecibido,
        fechaPago: pago.fechaPago,
        medioPago: pago.medioPago,
        codigoOperacion: pago.numeroRecibo,
        clienteNombre: cliente.nombres,
        clienteApellidos: cliente.apellidos,
        clienteDni: cliente.dni,
        clienteEmail: cliente.email,
        pagoFlowId: pago.pagoFlowId
      })
      .from(pago)
      .innerJoin(cuota, eq(pago.cuotaId, cuota.id))
      .innerJoin(prestamo, eq(cuota.prestamoId, prestamo.id))
      .innerJoin(cliente, eq(prestamo.clienteId, cliente.id))
      .orderBy(desc(pago.fechaPago))

    const { env } = getFlowConfig()
    const paymentBaseUrl =
      env === 'production'
        ? 'https://www.flow.cl/app/web/pay.php'
        : 'https://sandbox.flow.cl/app/web/pay.php'

    // 3. Normalize Flow Payments
    const normalizedFlow = flowPayments.map(p => ({
      id: p.id,
      clienteNombre: p.concepto, // Usually contains client name in concept
      clienteDni: p.email, // Flow uses email as identifier often
      fechaPago: p.fechaPago || p.fechaCreacion,
      monto: Number(p.monto),
      medioPago: p.medioPago || 'Flow',
      codigoOperacion: p.flowOrder,
      estado:
        p.estado === 'PAGADO'
          ? 'Completado'
          : p.estado === 'PENDIENTE'
            ? 'Pendiente'
            : 'Fallido',
      url: p.flowToken ? `${paymentBaseUrl}?token=${p.flowToken}` : null,
      type: 'FLOW'
    }))

    // 4. Normalize Cash Payments
    // Filter out payments that are already linked to a Flow payment to avoid duplication
    // We only want to show:
    // 1. Pure Cash payments (no pagoFlowId)
    // 2. Flow payments (from the flowPayments list)
    // We do NOT want to show the internal 'pago' record created for a Flow transaction,
    // because that's just an internal record-keeping artifact.
    const normalizedCash = cashPayments
      .filter(p => !p.pagoFlowId) // Exclude payments linked to Flow
      .map(p => ({
        id: p.id,
        clienteNombre: `${p.clienteNombre} ${p.clienteApellidos}`,
        clienteDni: p.clienteDni,
        fechaPago: p.fechaPago,
        monto: Number(p.monto),
        medioPago: p.medioPago,
        codigoOperacion: p.codigoOperacion,
        estado: 'Completado',
        url: null,
        type: 'CASH'
      }))

    // 5. Merge and Sort
    const allPayments = [...normalizedFlow, ...normalizedCash].sort(
      (a, b) =>
        new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()
    )

    return allPayments
  } catch (error) {
    console.error('Error fetching all payments:', error)
    return []
  }
}

export async function sendPaymentReceipt(
  paymentId: string,
  type: 'FLOW' | 'CASH'
) {
  const db = getDb()
  if (!db) return { success: false, error: 'No database connection' }

  try {
    // Solo para pagos FLOW generamos comprobante PDF
    if (type === 'FLOW') {
      // 1. Buscar si ya existe un comprobante para este pago
      const [existingComprobante] = await db
        .select()
        .from(comprobante)
        .where(eq(comprobante.pagoFlowId, paymentId))
        .limit(1)

      let comprobanteId: string

      if (existingComprobante) {
        // Ya existe, usar el existente
        comprobanteId = existingComprobante.id
      } else {
        // No existe, generar nuevo comprobante
        const { generateComprobante } =
          await import('@/modules/comprobantes/server')
        const result = await generateComprobante(paymentId)

        if (!result.success || !result.comprobante) {
          return {
            success: false,
            error: result.error || 'Error al generar comprobante'
          }
        }

        comprobanteId = result.comprobante.id
      }

      // 2. Obtener teléfono del cliente
      const pagoFlowData = await db
        .select()
        .from(pagoFlow)
        .where(eq(pagoFlow.id, paymentId))
        .limit(1)

      if (pagoFlowData.length === 0) {
        return { success: false, error: 'Pago no encontrado' }
      }

      const p = pagoFlowData[0]

      if (!p.prestamoId) {
        return { success: false, error: 'Pago no asociado a préstamo' }
      }

      const clientData = await db
        .select({ phone: cliente.telefono })
        .from(prestamo)
        .where(eq(prestamo.id, p.prestamoId))
        .innerJoin(cliente, eq(prestamo.clienteId, cliente.id))
        .limit(1)

      if (clientData.length === 0) {
        return { success: false, error: 'Cliente no encontrado' }
      }

      // 3. Enviar comprobante por WhatsApp
      const { sendComprobanteWhatsApp } =
        await import('@/modules/comprobantes/server')
      const sendResult = await sendComprobanteWhatsApp(
        comprobanteId,
        clientData[0].phone
      )

      return sendResult
    } else {
      // Para pagos en EFECTIVO, mantener mensaje de texto simple
      let phone = ''
      let message = ''

      const paymentData = await db
        .select({
          monto: pago.montoTotalRecibido,
          fecha: pago.fechaPago,
          recibo: pago.numeroRecibo,
          clienteNombre: cliente.nombres,
          clientePhone: cliente.telefono
        })
        .from(pago)
        .where(eq(pago.id, paymentId))
        .innerJoin(cuota, eq(pago.cuotaId, cuota.id))
        .innerJoin(prestamo, eq(cuota.prestamoId, prestamo.id))
        .innerJoin(cliente, eq(prestamo.clienteId, cliente.id))
        .limit(1)

      if (paymentData.length === 0) {
        return { success: false, error: 'Pago no encontrado' }
      }

      const p = paymentData[0]
      phone = p.clientePhone
      message = `Hola ${p.clienteNombre}, confirmamos tu pago en efectivo.\n\nRecibo: ${p.recibo}\nMonto: S/ ${p.monto}\nFecha: ${p.fecha.toLocaleDateString()}`

      if (phone && message) {
        await sendWhatsappMessage(phone, message)
        return { success: true }
      } else {
        return {
          success: false,
          error: 'No se pudo obtener el teléfono del cliente'
        }
      }
    }
  } catch (error) {
    console.error('Error sending receipt:', error)
    return { success: false, error: 'Error al enviar el comprobante' }
  }
}

export async function cancelPayment(id: string) {
  const db = getDb()
  if (!db) return { success: false, error: 'No database connection' }

  try {
    await db
      .update(pagoFlow)
      .set({ estado: 'CANCELADO' })
      .where(eq(pagoFlow.id, id))

    revalidatePath('/payments')
    return { success: true }
  } catch (error) {
    console.error('Error canceling payment:', error)
    return { success: false, error: 'Error al cancelar el pago' }
  }
}

export async function generatePaymentLink(data: {
  email: string
  amount: number
  concept: string
  clientId?: string
  loanId?: string
  baseAmount?: number
}) {
  try {
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'

    // Webhook URL must be public (ngrok/production) so Flow can notify us
    const webhookBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`

    // Return URL should match the user's current session origin to avoid cookie issues
    let returnBaseUrl = `${protocol}://${host}`

    // If REDIRECT_PAYMENT is production, force use of NEXT_PUBLIC_APP_URL
    if (
      process.env.REDIRECT_PAYMENT === 'production' &&
      process.env.NEXT_PUBLIC_APP_URL
    ) {
      returnBaseUrl = process.env.NEXT_PUBLIC_APP_URL.trim()
    }

    // Use API route for return to handle POST -> GET redirect properly
    const returnUrl = `${returnBaseUrl}/api/payments/return`

    // Generar ID único para la orden
    const commerceOrder = `ORD-${Date.now()}`

    // 1. Crear registro en BD (Pendiente)
    const db = getDb()
    if (!db) throw new Error('No database connection')

    await db.insert(pagoFlow).values({
      flowOrder: commerceOrder,
      email: data.email,
      monto: data.amount.toString(),
      concepto: data.concept,
      estado: 'PENDIENTE',
      currency: 'PEN',
      prestamoId: data.loanId,
      montoBase: data.baseAmount ? data.baseAmount.toString() : null
    })

    const response = await createFlowOrder({
      commerceOrder,
      subject: data.concept,
      amount: data.amount,
      email: data.email,
      urlConfirmation: `${webhookBaseUrl}/api/payments/webhook`,
      urlReturn: returnUrl,
      currency: 'PEN'
    })

    // 2. Actualizar token de Flow en BD
    await db
      .update(pagoFlow)
      .set({ flowToken: response.token })
      .where(eq(pagoFlow.flowOrder, commerceOrder))

    // 3. Enviar WhatsApp si hay clientId
    // if (data.clientId) {
    //   try {
    //     const [clientData] = await db
    //       .select({
    //         phone: cliente.telefono,
    //         nombres: cliente.nombres
    //       })
    //       .from(cliente)
    //       .where(eq(cliente.id, data.clientId))

    //     if (clientData && clientData.phone) {
    //       const paymentUrl = `${response.url}?token=${response.token}`
    //       const message = `Hola ${clientData.nombres}, se ha generado un link de pago para: *${data.concept}*.\n\nMonto: S/ ${data.amount.toFixed(2)}\n\nPuedes pagar aquí: ${paymentUrl}`

    //       await sendWhatsappMessage(clientData.phone, message)
    //     }
    //   } catch (wsError) {
    //     console.error('Error sending WhatsApp message:', wsError)
    //     // No fallamos la request principal si falla el WS
    //   }
    // }

    return {
      success: true,
      url: `${response.url}?token=${response.token}`,
      token: response.token
    }
  } catch (error: unknown) {
    console.error('Error generating payment link:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'No se pudo generar el link de pago'
    }
  }
}

export async function resendPaymentLink(data: {
  clientId: string
  url: string
  concept: string
  amount: number
}) {
  const db = getDb()
  if (!db) return { success: false, error: 'Database connection failed' }

  try {
    const [clientData] = await db
      .select({
        phone: cliente.telefono,
        nombres: cliente.nombres
      })
      .from(cliente)
      .where(eq(cliente.id, data.clientId))

    if (!clientData || !clientData.phone) {
      return { success: false, error: 'Cliente no encontrado o sin teléfono' }
    }

    const message = `Hola ${clientData.nombres}, aquí tienes tu link de pago para: *${data.concept}*.\n\nMonto: S/ ${data.amount.toFixed(2)}\n\nPuedes pagar aquí: ${data.url}`

    await sendWhatsappMessage(clientData.phone, message)

    return { success: true }
  } catch (error) {
    console.error('Error resending payment link:', error)
    return { success: false, error: 'Error enviando mensaje de WhatsApp' }
  }
}

export async function checkPaymentStatus(token: string) {
  const db = getDb()
  if (!db) return { success: false, status: 'UNKNOWN' }

  try {
    // 1. Check DB Status
    const existingPayment = await db.query.pagoFlow.findFirst({
      where: eq(pagoFlow.flowToken, token)
    })

    if (!existingPayment) return { success: false, status: 'NOT_FOUND' }

    if (existingPayment.estado === 'PAGADO') {
      return { success: true, status: 'PAGADO' }
    }

    // 2. If Pending, check Flow API
    const { getFlowOrderStatus } = await import('@/proxy/payments/flow-service')
    const status = await getFlowOrderStatus(token)

    if (status.status === 2) {
      // 2 = Pagada
      // Update DB
      await db
        .update(pagoFlow)
        .set({
          estado: 'PAGADO',
          fechaPago: new Date(),
          medioPago: status.paymentData?.media || 'Flow'
        })
        .where(eq(pagoFlow.flowToken, token))

      // Process Loan
      if (existingPayment.prestamoId && existingPayment.montoBase) {
        await processLoanPayment(
          existingPayment.prestamoId,
          Number(existingPayment.montoBase),
          existingPayment.id
        )
      }

      // Register Caja Movement
      try {
        const { calcularComisionFlow, determinarMedioPagoFlow } =
          await import('@/modules/caja/lib/calcular-comision-flow')
        const { crearMovimientoCaja } = await import('@/modules/caja/server')

        const mediaRaw = status.paymentData?.media || 'TARJETA'
        const medioPago = determinarMedioPagoFlow(mediaRaw)
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
      } catch (e) {
        console.error('Error registering box movement in polling:', e)
      }

      return { success: true, status: 'PAGADO' }
    }

    return { success: true, status: existingPayment.estado }
  } catch (error) {
    console.error('Error checking payment status:', error)
    return { success: false, status: 'ERROR' }
  }
}

export async function processLoanPayment(
  prestamoId: string,
  montoPagado: number,
  pagoFlowId: string
) {
  const db = getDb()
  if (!db) return

  try {
    // 1. Get installments
    const installments = await db
      .select()
      .from(cuota)
      .where(eq(cuota.prestamoId, prestamoId))
      .orderBy(asc(cuota.numeroCuota))

    let remainingAmount = montoPagado

    for (const inst of installments) {
      if (remainingAmount <= 0.01) break // Threshold for float precision
      if (inst.estado === 'PAGADO') continue

      const pending = Number(inst.saldoPendiente ?? inst.totalConSeguro)
      let paymentForThis = 0

      // Use a small epsilon for floating point comparison
      if (remainingAmount >= pending - 0.01) {
        paymentForThis = pending
        // Full payment of this installment
        await db
          .update(cuota)
          .set({
            estado: 'PAGADO',
            saldoPendiente: '0.00',
            montoPagado: (Number(inst.montoPagado || 0) + pending).toString(),
            fechaPago: new Date()
          })
          .where(eq(cuota.id, inst.id))
        remainingAmount -= pending
      } else {
        paymentForThis = remainingAmount
        // Partial payment
        const newSaldo = pending - remainingAmount

        // Check if new balance is effectively zero
        if (newSaldo <= 0.01) {
          await db
            .update(cuota)
            .set({
              estado: 'PAGADO',
              saldoPendiente: '0.00',
              montoPagado: (
                Number(inst.montoPagado || 0) + remainingAmount
              ).toString(),
              fechaPago: new Date()
            })
            .where(eq(cuota.id, inst.id))
        } else {
          await db
            .update(cuota)
            .set({
              saldoPendiente: newSaldo.toString(),
              montoPagado: (
                Number(inst.montoPagado || 0) + remainingAmount
              ).toString(),
              estado: 'PENDIENTE'
            })
            .where(eq(cuota.id, inst.id))
        }
        remainingAmount = 0
      }

      // Create Payment Record
      await db.insert(pago).values({
        cuotaId: inst.id,
        pagoFlowId: pagoFlowId,
        fechaPago: new Date(),
        montoTotalRecibido: paymentForThis.toString(),
        interesCobrado: '0.00', // Simplified
        capitalCobrado: paymentForThis.toString(), // Simplified
        medioPago: 'FLOW',
        numeroRecibo: `FLOW-${pagoFlowId.slice(0, 8)}`
      })
    }

    // Check if all installments are paid
    const pendingInstallments = await db
      .select()
      .from(cuota)
      .where(
        and(eq(cuota.prestamoId, prestamoId), not(eq(cuota.estado, 'PAGADO')))
      )

    if (pendingInstallments.length === 0) {
      await db
        .update(prestamo)
        .set({ estado: 'PAGADO' })
        .where(eq(prestamo.id, prestamoId))
    }

    // Generate Comprobante and Send via WhatsApp
    try {
      // 1. Generate Comprobante
      const result = await generateComprobante(pagoFlowId)

      if (result.success && result.comprobante) {
        // 2. Get Client Phone
        const clientData = await db
          .select({ phone: cliente.telefono })
          .from(prestamo)
          .where(eq(prestamo.id, prestamoId))
          .innerJoin(cliente, eq(prestamo.clienteId, cliente.id))
          .limit(1)

        if (clientData.length > 0 && clientData[0].phone) {
          // 3. Send WhatsApp
          await sendComprobanteWhatsApp(
            result.comprobante.id,
            clientData[0].phone
          )
        }
      }
    } catch (error) {
      console.error('Error sending automatic receipt:', error)
    }
  } catch (error) {
    console.error('Error processing loan payment:', error)
  }
}

export async function registerCashPayment(data: {
  loanId: string
  amount: number
  concept?: string
}) {
  const db = getDb()
  if (!db) return { success: false, error: 'No database connection' }

  try {
    // Validar que haya sesión de caja abierta
    const { getSesionActual } = await import('@/modules/caja/server')
    const sesionResult = await getSesionActual()

    if (!sesionResult.success || !sesionResult.sesionAbierta) {
      return {
        success: false,
        error:
          'No hay sesión de caja abierta. Debes abrir caja antes de registrar pagos en efectivo.'
      }
    }

    // 1. Get installments
    const installments = await db
      .select()
      .from(cuota)
      .where(eq(cuota.prestamoId, data.loanId))
      .orderBy(asc(cuota.numeroCuota))

    let remainingAmount = data.amount
    let processedCount = 0
    const receiptNumber = `REC-${Date.now().toString().slice(-8)}`

    for (const inst of installments) {
      if (remainingAmount <= 0.01) break
      if (inst.estado === 'PAGADO') continue

      const pending = Number(inst.saldoPendiente ?? inst.totalConSeguro)
      let paymentForThis = 0

      // Use epsilon for float comparison
      if (remainingAmount >= pending - 0.01) {
        paymentForThis = pending
        // Full payment
        await db
          .update(cuota)
          .set({
            estado: 'PAGADO',
            saldoPendiente: '0.00',
            montoPagado: (Number(inst.montoPagado || 0) + pending).toString(),
            fechaPago: new Date()
          })
          .where(eq(cuota.id, inst.id))
        remainingAmount -= pending
      } else {
        paymentForThis = remainingAmount
        // Partial payment
        const newSaldo = pending - remainingAmount

        if (newSaldo <= 0.01) {
          await db
            .update(cuota)
            .set({
              estado: 'PAGADO',
              saldoPendiente: '0.00',
              montoPagado: (
                Number(inst.montoPagado || 0) + remainingAmount
              ).toString(),
              fechaPago: new Date()
            })
            .where(eq(cuota.id, inst.id))
        } else {
          await db
            .update(cuota)
            .set({
              saldoPendiente: newSaldo.toString(),
              montoPagado: (
                Number(inst.montoPagado || 0) + remainingAmount
              ).toString(),
              estado: 'PENDIENTE'
            })
            .where(eq(cuota.id, inst.id))
        }
        remainingAmount = 0
      }

      // Record payment
      await db.insert(pago).values({
        cuotaId: inst.id,
        fechaPago: new Date(),
        montoTotalRecibido: paymentForThis.toString(),
        interesCobrado: '0.00',
        capitalCobrado: paymentForThis.toString(),
        medioPago: 'EFECTIVO',
        numeroRecibo: receiptNumber
      })

      processedCount++
    }

    // Check if all installments are paid
    const pendingInstallments = await db
      .select()
      .from(cuota)
      .where(
        and(eq(cuota.prestamoId, data.loanId), not(eq(cuota.estado, 'PAGADO')))
      )

    if (pendingInstallments.length === 0) {
      await db
        .update(prestamo)
        .set({ estado: 'PAGADO' })
        .where(eq(prestamo.id, data.loanId))
    }

    // Crear movimiento de caja
    try {
      const { crearMovimientoCaja } = await import('@/modules/caja/server')
      await crearMovimientoCaja({
        tipo: 'INGRESO',
        categoria: 'PAGO_EFECTIVO',
        monto: data.amount,
        descripcion:
          data.concept || `Pago en efectivo - ${processedCount} cuota(s)`
      })
    } catch (cajaError) {
      console.warn('⚠️ No se pudo registrar movimiento de caja:', cajaError)
      // No fallar el pago si falla el registro de caja
    }

    revalidatePath('/payments')
    return { success: true, processedCount }
  } catch (error) {
    console.error('Error registering cash payment:', error)
    return { success: false, error: 'Error al registrar el pago en efectivo' }
  }
}

export async function syncLoanStatuses() {
  const db = getDb()
  if (!db) return { success: false, error: 'No db connection' }

  try {
    // 1. Get all loans that are not PAGADO
    const activeLoans = await db
      .select({ id: prestamo.id })
      .from(prestamo)
      .where(not(eq(prestamo.estado, 'PAGADO')))

    let updatedCount = 0

    // NEW: Fix pending installments that are actually paid (0 balance)
    const stuckInstallments = await db
      .select()
      .from(cuota)
      .where(
        and(eq(cuota.estado, 'PENDIENTE'), eq(cuota.saldoPendiente, '0.00'))
      )

    for (const inst of stuckInstallments) {
      await db
        .update(cuota)
        .set({ estado: 'PAGADO' })
        .where(eq(cuota.id, inst.id))
    }

    for (const loan of activeLoans) {
      // 2. Check pending installments
      const pendingInstallments = await db
        .select({ id: cuota.id })
        .from(cuota)
        .where(
          and(eq(cuota.prestamoId, loan.id), not(eq(cuota.estado, 'PAGADO')))
        )
        .limit(1)

      // 3. If no pending installments, mark as PAGADO
      if (pendingInstallments.length === 0) {
        await db
          .update(prestamo)
          .set({ estado: 'PAGADO' })
          .where(eq(prestamo.id, loan.id))
        updatedCount++
      }
    }

    return { success: true, updatedCount }
  } catch (error) {
    console.error('Error syncing loan statuses:', error)
    return { success: false, error: 'Sync failed' }
  }
}
