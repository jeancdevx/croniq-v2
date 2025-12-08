import type { Debtor } from '../types'

/**
 * Convierte un objeto Debtor a DebtorInfo con estructura completa
 * requerida por la API de WhatsApp
 */
export function debtorToDebtorInfo(debtor: Debtor) {
  return {
    id: debtor.id,
    customerName: debtor.nombre,
    documentType: 'DNI' as const,
    documentNumber: debtor.dni,
    phone: debtor.telefono,
    nextPaymentDate: debtor.vencimiento,
    nextPaymentAmount: debtor.deuda,
    daysUntilPayment: debtor.diasRestantes,
    status: (debtor.estado === 'vencido'
      ? 'overdue'
      : debtor.estado === 'vence_hoy'
        ? 'due_today'
        : 'upcoming') as 'overdue' | 'due_today' | 'upcoming',
    loanId: `LOAN-${debtor.id}`,
    loan: {
      id: `LOAN-${debtor.id}`,
      amount: debtor.deuda.toString(),
      interestRate: '0.80',
      interestRateType: 'MENSUAL',
      lateFeeRate: '0.05',
      installments: 12,
      loanCurrency: 'PEN',
      paymentCurrency: 'PEN',
      exchangeRate: '1.00',
      status: 'ACTIVE',
      disbursementDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      customer: {
        id: debtor.id,
        firstName: debtor.nombre.split(' ')[0],
        lastName:
          debtor.nombre.split(' ').slice(1).join(' ') ||
          debtor.nombre.split(' ')[0],
        fullName: debtor.nombre,
        email: `${debtor.dni}@example.com`,
        phone: debtor.telefono,
        documentType: 'DNI',
        documentNumber: debtor.dni
      }
    },
    payments: [
      {
        id: `PAY-${debtor.id}-1`,
        installmentNumber: 1,
        dueDate: debtor.vencimiento,
        principalAmount: (debtor.deuda * 0.9).toFixed(2),
        interestAmount: (debtor.deuda * 0.1).toFixed(2),
        totalAmount: debtor.deuda.toFixed(2),
        lateFeeAmount: '0.00',
        paidAmount: '0.00',
        paidAt: null,
        status:
          debtor.estado === 'vencido'
            ? 'OVERDUE'
            : debtor.estado === 'vence_hoy'
              ? 'DUE'
              : 'PENDING'
      }
    ],
    totals: {
      totalPrincipal: debtor.deuda * 0.9,
      totalInterest: debtor.deuda * 0.1,
      grandTotal: debtor.deuda,
      totalPaid: 0,
      remaining: debtor.deuda
    }
  }
}
