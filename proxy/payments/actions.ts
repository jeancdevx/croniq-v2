'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

import { and, asc, desc, eq, not } from 'drizzle-orm'

import { getDb } from '@/db'
import { cliente } from '@/db/schema/cliente.schema'
import { cuota } from '@/db/schema/cuota.schema'
import { pagoFlow } from '@/db/schema/pago-flow.schema'
import { pago } from '@/db/schema/pago.schema'
import { prestamo } from '@/db/schema/prestamo.schema'

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
      .where(eq(prestamo.clienteId, clientId))
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
    let phone = ''
    let message = ''

    if (type === 'CASH') {
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

      if (paymentData.length === 0)
        return { success: false, error: 'Pago no encontrado' }
      const p = paymentData[0]
      phone = p.clientePhone
      message = `Hola ${p.clienteNombre}, confirmamos tu pago en efectivo.\n\nRecibo: ${p.recibo}\nMonto: S/ ${p.monto}\nFecha: ${p.fecha.toLocaleDateString()}`
    } else {
      // Flow Payment
      const paymentData = await db
        .select()
        .from(pagoFlow)
        .where(eq(pagoFlow.id, paymentId))
        .limit(1)

      if (paymentData.length === 0)
        return { success: false, error: 'Pago no encontrado' }
      const p = paymentData[0]

      // Need to find client phone - Flow payment might be linked to a loan -> client
      if (p.prestamoId) {
        const clientData = await db
          .select({ phone: cliente.telefono, nombres: cliente.nombres })
          .from(prestamo)
          .where(eq(prestamo.id, p.prestamoId))
          .innerJoin(cliente, eq(prestamo.clienteId, cliente.id))
          .limit(1)

        if (clientData.length > 0) {
          phone = clientData[0].phone
          message = `Hola ${clientData[0].nombres}, confirmamos tu pago vía Flow.\n\nOrden: ${p.flowOrder}\nMonto: S/ ${p.monto}\nEstado: ${p.estado}`
        }
      }
    }

    if (phone && message) {
      await sendWhatsappMessage(phone, message)
      return { success: true }
    } else {
      return {
        success: false,
        error: 'No se pudo obtener el teléfono del cliente'
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
    const returnBaseUrl = `${protocol}://${host}`
    const returnUrl = `${returnBaseUrl}/payment/success`

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
    if (data.clientId) {
      try {
        const [clientData] = await db
          .select({
            phone: cliente.telefono,
            nombres: cliente.nombres
          })
          .from(cliente)
          .where(eq(cliente.id, data.clientId))

        if (clientData && clientData.phone) {
          const paymentUrl = `${response.url}?token=${response.token}`
          const message = `Hola ${clientData.nombres}, se ha generado un link de pago para: *${data.concept}*.\n\nMonto: S/ ${data.amount.toFixed(2)}\n\nPuedes pagar aquí: ${paymentUrl}`

          await sendWhatsappMessage(clientData.phone, message)
        }
      } catch (wsError) {
        console.error('Error sending WhatsApp message:', wsError)
        // No fallamos la request principal si falla el WS
      }
    }

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

      if (remainingAmount >= pending) {
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
        await db
          .update(cuota)
          .set({
            saldoPendiente: (pending - remainingAmount).toString(),
            montoPagado: (
              Number(inst.montoPagado || 0) + remainingAmount
            ).toString(),
            estado: 'PENDIENTE' // Remains pending
          })
          .where(eq(cuota.id, inst.id))
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

      if (remainingAmount >= pending) {
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
        await db
          .update(cuota)
          .set({
            saldoPendiente: (pending - remainingAmount).toString(),
            montoPagado: (
              Number(inst.montoPagado || 0) + remainingAmount
            ).toString(),
            estado: 'PENDIENTE'
          })
          .where(eq(cuota.id, inst.id))
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
