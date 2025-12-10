import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@clerk/nextjs/server'

import type { DebtorInfo } from '@/types/reminder'
import { generateAndEncodePDF } from '@/lib/pdf-generator'
import { createWazendClient } from '@/lib/wazend-client'

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as {
      debtor: DebtorInfo
    }

    const { debtor } = body

    if (!debtor) {
      return NextResponse.json(
        { error: 'Debtor information is required' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfBase64 = await generateAndEncodePDF(
      debtor.loan,
      debtor.payments,
      debtor.totals
    )

    // Create WhatsApp client
    const wazendClient = createWazendClient()

    // Format phone number
    let formattedPhone = debtor.phone.replace(/\D/g, '') // Remove non-digits
    if (formattedPhone.length === 9) {
      formattedPhone = `51${formattedPhone}`
    }

    // Prepare message caption
    const caption = `Hola ${debtor.customerName},\n\nAdjunto encontrarás el cronograma de pagos de tu préstamo.\n\n📅 Próximo pago: ${new Date(debtor.nextPaymentDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}\n💰 Monto: S/ ${debtor.nextPaymentAmount.toFixed(2)}\n\n¡Gracias por tu confianza!`

    // Send document via WhatsApp
    const result = await wazendClient.sendDocument({
      number: formattedPhone,
      mediatype: 'document',
      mimetype: 'application/pdf',
      caption,
      media: pdfBase64,
      fileName: `Cronograma_${debtor.customerName.replace(/\s+/g, '_')}_${debtor.loanId}.pdf`
    })

    return NextResponse.json({
      success: true,
      message: 'Payment schedule sent successfully',
      wazendResponse: result
    })
  } catch (error) {
    console.error('Error sending payment schedule:', error)
    return NextResponse.json(
      {
        error: 'Failed to send payment schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
