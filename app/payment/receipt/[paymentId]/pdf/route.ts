import { NextResponse } from 'next/server'

import { renderToBuffer } from '@react-pdf/renderer'
import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { comprobante, comprobanteDetalle } from '@/db/schema'

import { generateQRImage } from '@/modules/comprobantes/lib/generate-qr-image'
import { BoletaPDF } from '@/modules/comprobantes/lib/pdf-boleta'
import { generateComprobante } from '@/modules/comprobantes/server/generate-comprobante'
import { getPagoFlowDetails } from '@/modules/comprobantes/server/get-pago-flow-details'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params
    const db = getDb()

    if (!db) {
      return new NextResponse('Error de base de datos', { status: 500 })
    }

    // 1. Buscar si ya existe un comprobante para este pago
    const [existingComprobante] = await db
      .select()
      .from(comprobante)
      .where(eq(comprobante.pagoFlowId, paymentId))
      .limit(1)

    let comprobanteData = existingComprobante

    // 2. Si no existe, generarlo
    if (!comprobanteData) {
      const result = await generateComprobante({ pagoFlowId: paymentId })
      if (!result.success || !result.comprobante) {
        return new NextResponse(result.error || 'Error generando comprobante', {
          status: 500
        })
      }
      comprobanteData = result.comprobante
    }

    // 3. Obtener detalles del comprobante
    const detalles = await db
      .select()
      .from(comprobanteDetalle)
      .where(eq(comprobanteDetalle.comprobanteId, comprobanteData.id))
      .orderBy(comprobanteDetalle.orden)

    // 4. Obtener datos del cliente y pago flow
    const flowDetails = await getPagoFlowDetails(paymentId)

    // 5. Generar imagen QR
    const qrImage = await generateQRImage(comprobanteData.qrData)

    // 6. Generar PDF
    const buffer = await renderToBuffer(
      BoletaPDF({
        comprobante: comprobanteData,
        detalles,
        cliente: flowDetails.cliente,
        qrImage
      })
    )

    // 7. Retornar PDF
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Comprobante-${comprobanteData.numeroCompleto.replace('/', '-')}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error serving receipt PDF:', error)
    return new NextResponse('Error interno al generar el PDF', { status: 500 })
  }
}
