'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

import { desc, eq, not } from 'drizzle-orm'

import { getDb } from '@/db'
import { cliente } from '@/db/schema/cliente.schema'
import { pagoFlow } from '@/db/schema/pago-flow.schema'
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

export async function getFlowPayments() {
  const db = getDb()
  if (!db) return []

  const payments = await db
    .select()
    .from(pagoFlow)
    .where(not(eq(pagoFlow.estado, 'CANCELADO')))
    .orderBy(desc(pagoFlow.fechaCreacion))

  const { env } = getFlowConfig()
  const paymentBaseUrl =
    env === 'production'
      ? 'https://www.flow.cl/app/web/pay.php'
      : 'https://sandbox.flow.cl/app/web/pay.php'

  return payments.map(p => ({
    ...p,
    url: p.flowToken ? `${paymentBaseUrl}?token=${p.flowToken}` : null
  }))
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
}) {
  try {
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const baseUrl = `${protocol}://${host}`

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
      currency: 'PEN'
    })

    const response = await createFlowOrder({
      commerceOrder,
      subject: data.concept,
      amount: data.amount,
      email: data.email,
      // IMPORTANTE: Para que Flow notifique a tu servidor, esta URL debe ser pública.
      // En desarrollo (localhost), Flow NO podrá llamar a esta URL a menos que uses ngrok.
      urlConfirmation: `${baseUrl}/api/payments/webhook`,
      urlReturn: `${baseUrl}/api/payments/return`,
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
