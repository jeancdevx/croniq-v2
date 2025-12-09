'use server'

import { renderToBuffer } from '@react-pdf/renderer'

import { createWazendClient } from '@/lib/wazend-client'

import { BCPSchedulePDF } from '../lib/pdf-bcp-format'
import { getLoanWithDetails } from './get-loan-with-details'

interface SendScheduleResult {
  success: boolean
  error?: string
}

/**
 * Envía el cronograma de pagos por WhatsApp al cliente
 * @param loanId - ID del préstamo
 * @returns Resultado de la operación
 */
export async function sendScheduleWhatsApp(
  loanId: string
): Promise<SendScheduleResult> {
  try {
    // 1. Obtener datos completos del préstamo
    const loan = await getLoanWithDetails(loanId)

    if (!loan) {
      return {
        success: false,
        error: 'Préstamo no encontrado'
      }
    }

    if (!loan.cliente) {
      return {
        success: false,
        error: 'Cliente no encontrado'
      }
    }

    if (!loan.cliente.telefono) {
      return {
        success: false,
        error: 'El cliente no tiene número de teléfono registrado'
      }
    }

    // 2. Generar PDF en memoria (no se guarda en disco)
    const pdfDocument = BCPSchedulePDF({ loan })
    const buffer = await renderToBuffer(pdfDocument)
    const pdfBase64 = buffer.toString('base64')

    // 3. Preparar mensaje
    const formatCurrency = (amount: string, currency: string) => {
      return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: currency || 'PEN'
      }).format(parseFloat(amount))
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    }

    const primeraCuota = loan.cuotas?.[0]
    const caption = `Hola ${loan.cliente.nombres},\n\nAdjunto encontrarás el cronograma de pagos de tu préstamo.\n\n📅 Próximo pago: ${formatDate(loan.fechaPrimerVencimiento)}\n💰 Monto: ${formatCurrency(primeraCuota?.totalConSeguro || '0', loan.monedaPago)}\n\n¡Gracias por tu confianza!`

    // 4. Enviar por WhatsApp
    const wazendClient = createWazendClient()

    // Formatear número con código de país (Perú +51)
    const phoneNumber = loan.cliente.telefono.startsWith('51')
      ? loan.cliente.telefono
      : `51${loan.cliente.telefono}`

    await wazendClient.sendDocument({
      number: phoneNumber,
      mediatype: 'document',
      mimetype: 'application/pdf',
      caption,
      media: pdfBase64,
      fileName: `Cronograma_${loan.cliente.nombres.replace(/\s+/g, '_')}_${loan.id.substring(0, 8)}.pdf`
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending schedule via WhatsApp:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error al enviar cronograma por WhatsApp'
    }
  }
}
