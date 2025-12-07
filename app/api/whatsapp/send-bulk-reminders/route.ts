import { NextRequest, NextResponse } from 'next/server'
import { createWazendClient } from '@/lib/wazend-client'
import { generateAndEncodePDF } from '@/lib/pdf-generator'
import { generateMockDebtors, filterDebtorsByDays } from '@/lib/mock-data'
import type { BulkSendResponse, SendResult } from '@/types/reminder'

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as {
            debtorIds?: string[]
            selectedDays?: number[]
            sendToOverdueOnly?: boolean
        }

        const { debtorIds, selectedDays = [], sendToOverdueOnly = false } = body

        // Get all debtors
        let debtors = generateMockDebtors()

        // Filter debtors based on criteria
        if (sendToOverdueOnly) {
            debtors = debtors.filter(
                d => d.status === 'overdue' || d.status === 'due_today'
            )
        } else if (debtorIds && debtorIds.length > 0) {
            debtors = debtors.filter(d => debtorIds.includes(d.id))
        } else if (selectedDays.length > 0) {
            debtors = filterDebtorsByDays(debtors, selectedDays)
        }

        if (debtors.length === 0) {
            return NextResponse.json({
                total: 0,
                sent: 0,
                failed: 0,
                results: []
            } as BulkSendResponse)
        }

        // Create WhatsApp client
        const wazendClient = createWazendClient()

        // Send to each debtor
        const results: SendResult[] = []

        for (const debtor of debtors) {
            try {
                // Generate PDF
                const pdfBase64 = await generateAndEncodePDF(
                    debtor.loan,
                    debtor.payments,
                    debtor.totals
                )

                // Prepare message caption
                let caption: string
                if (debtor.status === 'overdue') {
                    caption = `Hola ${debtor.customerName},\n\n⚠️ RECORDATORIO DE PAGO VENCIDO\n\nTu pago está vencido desde hace ${Math.abs(debtor.daysUntilPayment)} días.\n\n📅 Fecha de vencimiento: ${new Date(debtor.nextPaymentDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}\n💰 Monto: S/ ${debtor.nextPaymentAmount.toFixed(2)}\n\nPor favor, regulariza tu situación lo antes posible para evitar cargos adicionales.\n\nAdjunto encontrarás el cronograma completo de pagos.`
                } else if (debtor.status === 'due_today') {
                    caption = `Hola ${debtor.customerName},\n\n📢 RECORDATORIO: Tu pago vence HOY\n\n💰 Monto: S/ ${debtor.nextPaymentAmount.toFixed(2)}\n\nPor favor, realiza tu pago hoy para evitar cargos por mora.\n\nAdjunto encontrarás el cronograma completo de pagos.`
                } else {
                    caption = `Hola ${debtor.customerName},\n\n📅 RECORDATORIO DE PAGO PRÓXIMO\n\nTu próximo pago vence en ${debtor.daysUntilPayment} días.\n\n📅 Fecha de vencimiento: ${new Date(debtor.nextPaymentDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}\n💰 Monto: S/ ${debtor.nextPaymentAmount.toFixed(2)}\n\nAdjunto encontrarás el cronograma completo de pagos.\n\n¡Gracias por tu confianza!`
                }

                // Send document via WhatsApp
                await wazendClient.sendDocument({
                    number: debtor.phone,
                    mediatype: 'document',
                    mimetype: 'application/pdf',
                    caption,
                    media: pdfBase64,
                    fileName: `Cronograma_${debtor.customerName.replace(/\s+/g, '_')}_${debtor.loanId}.pdf`
                })

                results.push({
                    success: true,
                    debtorId: debtor.id,
                    customerName: debtor.customerName,
                    phone: debtor.phone
                })

                // Add a small delay between messages to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000))
            } catch (error) {
                results.push({
                    success: false,
                    debtorId: debtor.id,
                    customerName: debtor.customerName,
                    phone: debtor.phone,
                    error:
                        error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        const response: BulkSendResponse = {
            total: debtors.length,
            sent: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error sending bulk reminders:', error)
        return NextResponse.json(
            {
                error: 'Failed to send bulk reminders',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
