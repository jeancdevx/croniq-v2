import { NextResponse } from 'next/server'

import type { LoanData, PaymentData, PaymentTotals } from '@/types/reminder'
import { generateLoanSchedulePDF } from '@/lib/pdf-generator'

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

    const { cliente, cuotas, ...loan } = loanWithDetails

    const mappedLoan: LoanData = {
      id: loan.id,
      amount: loan.montoSolicitado,
      interestRate: loan.tem, // Using Monthly Rate
      interestRateType: 'MENSUAL',
      lateFeeRate: loan.tasaMora,
      installments: loan.numeroCuotas,
      loanCurrency: loan.monedaPrestamo,
      paymentCurrency: loan.monedaPago,
      exchangeRate: loan.tipoCambioDesembolso || '1.00',
      status: loan.estado,
      disbursementDate: loan.fechaDesembolso, // string YYYY-MM-DD
      createdAt: loan.createdAt.toISOString(),
      customer: {
        id: cliente.id,
        firstName: cliente.nombres,
        lastName: cliente.apellidos,
        fullName: `${cliente.nombres} ${cliente.apellidos}`,
        email: cliente.email || '',
        phone: cliente.telefono,
        documentType: 'DNI', // Assuming DNI as per schema 'dni' field
        documentNumber: cliente.dni
      }
    }

    const mappedPayments: PaymentData[] = cuotas.map(c => ({
      id: c.id,
      installmentNumber: c.numeroCuota,
      dueDate: c.fechaVencimiento, // string YYYY-MM-DD
      principalAmount: c.capital,
      interestAmount: c.interes,
      totalAmount: c.totalConSeguro,
      lateFeeAmount: c.montoMora,
      paidAmount: c.montoPagado,
      paidAt: c.fechaPago ? c.fechaPago.toISOString() : null,
      status: c.estado
    }))

    const totals: PaymentTotals = cuotas.reduce(
      (acc, c) => ({
        totalPrincipal: acc.totalPrincipal + Number(c.capital),
        totalInterest: acc.totalInterest + Number(c.interes),
        grandTotal: acc.grandTotal + Number(c.totalConSeguro),
        totalPaid: acc.totalPaid + Number(c.montoPagado),
        remaining:
          acc.remaining + (Number(c.totalConSeguro) - Number(c.montoPagado))
      }),
      {
        totalPrincipal: 0,
        totalInterest: 0,
        grandTotal: 0,
        totalPaid: 0,
        remaining: 0
      }
    )

    const buffer = await generateLoanSchedulePDF(
      mappedLoan,
      mappedPayments,
      totals
    )

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cronograma-${cliente.nombres.replace(/\s+/g, '-')}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new NextResponse('Error generando el PDF', { status: 500 })
  }
}
