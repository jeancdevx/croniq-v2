'use server'

import { headers } from 'next/headers'

import { desc, eq } from 'drizzle-orm'

import { getDb } from '@/lib/db'
import { cliente } from '@/lib/db/schema/cliente.schema'
import { pagoFlow } from '@/lib/db/schema/pago-flow.schema'

import { sendWhatsappMessage } from '@/modules/notifications/server/whatsapp'

import { createFlowOrder } from './flow-service'

export async function getFlowPayments() {
  const db = getDb()
  if (!db) return []

  return await db.select().from(pagoFlow).orderBy(desc(pagoFlow.fechaCreacion))
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
      urlReturn: `${baseUrl}/payments/receipts`,
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
