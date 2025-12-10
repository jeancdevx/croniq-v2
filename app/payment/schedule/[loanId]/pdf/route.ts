import { NextResponse } from 'next/server'

import { renderToBuffer } from '@react-pdf/renderer'

import { BCPSchedulePDF } from '@/modules/loans/lib/pdf-bcp-format'
import { getLoanWithDetails } from '@/modules/loans/server/get-loan-with-details'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ loanId: string }> }
) {
  try {
    const { loanId } = await params
    const loanWithDetails = await getLoanWithDetails(loanId)

    if (!loanWithDetails) {
      return new NextResponse('Préstamo no encontrado', { status: 404 })
    }

    const buffer = await renderToBuffer(
      BCPSchedulePDF({ loan: loanWithDetails })
    )

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cronograma-${loanWithDetails.cliente.nombres.replace(/\s+/g, '-')}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new NextResponse('Error generando el PDF', { status: 500 })
  }
}
