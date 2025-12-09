'use server'

import { renderToBuffer } from '@react-pdf/renderer'
import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { comprobante, comprobanteDetalle } from '@/db/schema'
import { createWazendClient } from '@/lib/wazend-client'

import { generateQRImage } from '../lib/generate-qr-image'
import { BoletaPDF } from '../lib/pdf-boleta'
import { getPagoFlowDetails } from './get-pago-flow-details'

/**
 * Envía el comprobante de pago por WhatsApp
 * @param comprobanteId - ID del comprobante generado
 * @param phone - Número de teléfono del cliente
 */
export async function sendComprobanteWhatsApp(
  comprobanteId: string,
  phone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()
    if (!db) throw new Error('No database connection')

    // 1. Obtener comprobante
    const [comprobanteData] = await db
      .select()
      .from(comprobante)
      .where(eq(comprobante.id, comprobanteId))

    if (!comprobanteData) {
      throw new Error('Comprobante no encontrado')
    }

    // 2. Obtener datos completos del pago Flow
    const details = await getPagoFlowDetails(comprobanteData.pagoFlowId)

    // 3. Obtener detalles del comprobante
    const detalles = await db
      .select()
      .from(comprobanteDetalle)
      .where(eq(comprobanteDetalle.comprobanteId, comprobanteId))
      .orderBy(comprobanteDetalle.orden)

    // 4. Generar QR image
    const qrImage = await generateQRImage(comprobanteData.qrData)

    // 5. Generar PDF
    const pdfBuffer = await renderToBuffer(
      BoletaPDF({
        comprobante: comprobanteData,
        detalles,
        cliente: details.cliente,
        qrImage
      })
    )

    // 6. Convertir a base64
    const pdfBase64 = pdfBuffer.toString('base64')

    // 7. Formatear teléfono
    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.length === 9) {
      formattedPhone = '51' + formattedPhone
    }

    // 8. Preparar mensaje
    const caption =
      `📄 *Comprobante de Pago*\n\n` +
      `Boleta: ${comprobanteData.numeroCompleto}\n` +
      `Monto: S/ ${comprobanteData.montoTotal}\n` +
      `Fecha: ${new Date(comprobanteData.fechaEmision).toLocaleDateString()}\n\n` +
      `Gracias por tu pago.`

    // 9. Enviar por WhatsApp
    const wazendClient = createWazendClient()
    await wazendClient.sendDocument({
      number: formattedPhone,
      mediatype: 'document',
      mimetype: 'application/pdf',
      caption,
      media: pdfBase64,
      fileName: `Comprobante_${comprobanteData.numeroCompleto.replace('/', '-')}.pdf`
    })

    console.log(
      `Comprobante ${comprobanteData.numeroCompleto} enviado a ${phone}`
    )

    return { success: true }
  } catch (error) {
    console.error('Error sending comprobante via WhatsApp:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
