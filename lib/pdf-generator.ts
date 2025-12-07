import { renderToBuffer } from '@react-pdf/renderer'
import { LoanSchedulePDF } from '@/lib/pdf-component'
import type { LoanData, PaymentData, PaymentTotals } from '@/types/reminder'

export async function generateLoanSchedulePDF(
    loan: LoanData,
    payments: PaymentData[],
    totals: PaymentTotals
): Promise<Buffer> {
    const pdfDocument = LoanSchedulePDF({ loan, payments, totals })
    const buffer = await renderToBuffer(pdfDocument)
    return buffer
}

export function pdfBufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64')
}

export async function generateAndEncodePDF(
    loan: LoanData,
    payments: PaymentData[],
    totals: PaymentTotals
): Promise<string> {
    const buffer = await generateLoanSchedulePDF(loan, payments, totals)
    return pdfBufferToBase64(buffer)
}
