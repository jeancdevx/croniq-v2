export type LoanData = {
    id: string
    amount: string
    interestRate: string
    interestRateType: string
    lateFeeRate: string
    installments: number
    loanCurrency: string
    paymentCurrency: string
    exchangeRate: string
    status: string
    disbursementDate: string
    createdAt: string
    customer: {
        id: string
        firstName: string
        lastName: string
        fullName: string
        email: string
        phone: string
        documentType: string
        documentNumber: string
    }
}

export type PaymentData = {
    id: string
    installmentNumber: number
    dueDate: string
    principalAmount: string
    interestAmount: string
    totalAmount: string
    lateFeeAmount: string
    paidAmount: string
    paidAt: string | null
    status: string
}

export type PaymentTotals = {
    totalPrincipal: number
    totalInterest: number
    grandTotal: number
    totalPaid: number
    remaining: number
}

export type DebtorInfo = {
    id: string
    customerName: string
    documentType: string
    documentNumber: string
    phone: string
    nextPaymentDate: string
    nextPaymentAmount: number
    daysUntilPayment: number
    status: 'upcoming' | 'due_today' | 'overdue'
    loanId: string
    loan: LoanData
    payments: PaymentData[]
    totals: PaymentTotals
}

export type ReminderConfig = {
    selectedDays: number[]
    customDays: number | null
}

export type SendResult = {
    success: boolean
    debtorId: string
    customerName: string
    phone: string
    error?: string
}

export type BulkSendResponse = {
    total: number
    sent: number
    failed: number
    results: SendResult[]
}
