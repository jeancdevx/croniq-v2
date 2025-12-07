import type { DebtorInfo, LoanData, PaymentData } from '@/types/reminder'

// Helper to calculate days between dates
function daysBetween(date1: Date, date2: Date): number {
    const diffTime = date2.getTime() - date1.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Helper to add days to a date
function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

// Generate payment schedule
function generatePayments(
    loanAmount: number,
    interestRate: number,
    installments: number,
    startDate: Date,
    lateFeeRate: number = 0.01
): PaymentData[] {
    const monthlyInterest = interestRate / 100
    const principalPerMonth = loanAmount / installments
    const payments: PaymentData[] = []

    for (let i = 1; i <= installments; i++) {
        const dueDate = addDays(startDate, i * 30)
        const interestAmount = loanAmount * monthlyInterest
        const totalAmount = principalPerMonth + interestAmount

        // Simulate some payments as paid, some pending, some overdue
        let status: string
        let paidAmount = '0.00'
        let paidAt: string | null = null
        let lateFeeAmount = '0.00'

        const today = new Date()
        const daysDiff = daysBetween(today, dueDate)

        if (i <= 2) {
            // First 2 payments are paid
            status = 'paid'
            paidAmount = totalAmount.toFixed(2)
            paidAt = addDays(dueDate, -2).toISOString()
        } else if (daysDiff < -5) {
            // Overdue by more than 5 days
            status = 'overdue'
            const monthsOverdue = Math.abs(Math.floor(daysDiff / 30))
            lateFeeAmount = (totalAmount * lateFeeRate * monthsOverdue).toFixed(2)
        } else if (daysDiff < 0) {
            status = 'overdue'
        } else if (daysDiff === 0) {
            status = 'due_today'
        } else {
            status = 'pending'
        }

        payments.push({
            id: `payment-${i}`,
            installmentNumber: i,
            dueDate: dueDate.toISOString(),
            principalAmount: principalPerMonth.toFixed(2),
            interestAmount: interestAmount.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            lateFeeAmount,
            paidAmount,
            paidAt,
            status
        })
    }

    return payments
}

// Generate mock debtors
export function generateMockDebtors(currentDate?: Date): DebtorInfo[] {
    const today = currentDate || new Date()
    const debtors: DebtorInfo[] = []

    // Debtor 1: Payment due in 3 days
    const loan1StartDate = addDays(today, -90)
    const loan1Amount = 5000
    const loan1: LoanData = {
        id: 'loan-001',
        amount: loan1Amount.toString(),
        interestRate: '5',
        interestRateType: 'monthly',
        lateFeeRate: '1',
        installments: 6,
        loanCurrency: 'PEN',
        paymentCurrency: 'PEN',
        exchangeRate: '1.00',
        status: 'active',
        disbursementDate: loan1StartDate.toISOString(),
        createdAt: loan1StartDate.toISOString(),
        customer: {
            id: 'customer-001',
            firstName: 'Arif',
            lastName: 'Khan',
            fullName: 'Arif Khan',
            email: 'arif.khan@example.com',
            phone: '51988456125',
            documentType: 'DNI',
            documentNumber: '12345678'
        }
    }
    const payments1 = generatePayments(loan1Amount, 5, 6, loan1StartDate)
    const nextPayment1 = payments1.find(p => p.status !== 'paid')!

    debtors.push({
        id: 'debtor-001',
        customerName: loan1.customer.fullName,
        documentType: loan1.customer.documentType,
        documentNumber: loan1.customer.documentNumber,
        phone: loan1.customer.phone,
        nextPaymentDate: nextPayment1.dueDate,
        nextPaymentAmount: parseFloat(nextPayment1.totalAmount),
        daysUntilPayment: daysBetween(today, new Date(nextPayment1.dueDate)),
        status: 'upcoming',
        loanId: loan1.id,
        loan: loan1,
        payments: payments1,
        totals: {
            totalPrincipal: loan1Amount,
            totalInterest: loan1Amount * 0.05 * 6,
            grandTotal: loan1Amount + loan1Amount * 0.05 * 6,
            totalPaid:
                payments1
                    .filter(p => p.status === 'paid')
                    .reduce((sum, p) => sum + parseFloat(p.paidAmount), 0),
            remaining:
                loan1Amount +
                loan1Amount * 0.05 * 6 -
                payments1
                    .filter(p => p.status === 'paid')
                    .reduce((sum, p) => sum + parseFloat(p.paidAmount), 0)
        }
    })

    // Debtor 2: Payment due in 5 days
    const loan2StartDate = addDays(today, -95)
    const loan2Amount = 3000
    const loan2: LoanData = {
        id: 'loan-002',
        amount: loan2Amount.toString(),
        interestRate: '4',
        interestRateType: 'monthly',
        lateFeeRate: '1',
        installments: 4,
        loanCurrency: 'PEN',
        paymentCurrency: 'PEN',
        exchangeRate: '1.00',
        status: 'active',
        disbursementDate: loan2StartDate.toISOString(),
        createdAt: loan2StartDate.toISOString(),
        customer: {
            id: 'customer-002',
            firstName: 'María',
            lastName: 'González López',
            fullName: 'María González López',
            email: 'maria.gonzalez@example.com',
            phone: '51987654321',
            documentType: 'DNI',
            documentNumber: '87654321'
        }
    }
    const payments2 = generatePayments(loan2Amount, 4, 4, loan2StartDate)
    const nextPayment2 = payments2.find(p => p.status !== 'paid')!

    debtors.push({
        id: 'debtor-002',
        customerName: loan2.customer.fullName,
        documentType: loan2.customer.documentType,
        documentNumber: loan2.customer.documentNumber,
        phone: loan2.customer.phone,
        nextPaymentDate: nextPayment2.dueDate,
        nextPaymentAmount: parseFloat(nextPayment2.totalAmount),
        daysUntilPayment: daysBetween(today, new Date(nextPayment2.dueDate)),
        status: 'upcoming',
        loanId: loan2.id,
        loan: loan2,
        payments: payments2,
        totals: {
            totalPrincipal: loan2Amount,
            totalInterest: loan2Amount * 0.04 * 4,
            grandTotal: loan2Amount + loan2Amount * 0.04 * 4,
            totalPaid:
                payments2
                    .filter(p => p.status === 'paid')
                    .reduce((sum, p) => sum + parseFloat(p.paidAmount), 0),
            remaining:
                loan2Amount +
                loan2Amount * 0.04 * 4 -
                payments2
                    .filter(p => p.status === 'paid')
                    .reduce((sum, p) => sum + parseFloat(p.paidAmount), 0)
        }
    })

    // Debtor 3: Payment due today
    const loan3StartDate = addDays(today, -60)
    const loan3Amount = 8000
    const loan3: LoanData = {
        id: 'loan-003',
        amount: loan3Amount.toString(),
        interestRate: '6',
        interestRateType: 'monthly',
        lateFeeRate: '1',
        installments: 12,
        loanCurrency: 'PEN',
        paymentCurrency: 'PEN',
        exchangeRate: '1.00',
        status: 'active',
        disbursementDate: loan3StartDate.toISOString(),
        createdAt: loan3StartDate.toISOString(),
        customer: {
            id: 'customer-003',
            firstName: 'Carlos',
            lastName: 'Rodríguez Sánchez',
            fullName: 'Carlos Rodríguez Sánchez',
            email: 'carlos.rodriguez@example.com',
            phone: '51912345678',
            documentType: 'DNI',
            documentNumber: '11223344'
        }
    }
    const payments3 = generatePayments(loan3Amount, 6, 12, loan3StartDate)
    const nextPayment3 = payments3.find(p => p.status !== 'paid')!

    debtors.push({
        id: 'debtor-003',
        customerName: loan3.customer.fullName,
        documentType: loan3.customer.documentType,
        documentNumber: loan3.customer.documentNumber,
        phone: loan3.customer.phone,
        nextPaymentDate: nextPayment3.dueDate,
        nextPaymentAmount: parseFloat(nextPayment3.totalAmount),
        daysUntilPayment: 0,
        status: 'due_today',
        loanId: loan3.id,
        loan: loan3,
        payments: payments3,
        totals: {
            totalPrincipal: loan3Amount,
            totalInterest: loan3Amount * 0.06 * 12,
            grandTotal: loan3Amount + loan3Amount * 0.06 * 12,
            totalPaid:
                payments3
                    .filter(p => p.status === 'paid')
                    .reduce((sum, p) => sum + parseFloat(p.paidAmount), 0),
            remaining:
                loan3Amount +
                loan3Amount * 0.06 * 12 -
                payments3
                    .filter(p => p.status === 'paid')
                    .reduce((sum, p) => sum + parseFloat(p.paidAmount), 0)
        }
    })

    // Debtor 4: Payment overdue by 7 days
    const loan4StartDate = addDays(today, -97)
    const loan4Amount = 4500
    const loan4: LoanData = {
        id: 'loan-004',
        amount: loan4Amount.toString(),
        interestRate: '5.5',
        interestRateType: 'monthly',
        lateFeeRate: '1',
        installments: 8,
        loanCurrency: 'PEN',
        paymentCurrency: 'PEN',
        exchangeRate: '1.00',
        status: 'active',
        disbursementDate: loan4StartDate.toISOString(),
        createdAt: loan4StartDate.toISOString(),
        customer: {
            id: 'customer-004',
            firstName: 'Ana',
            lastName: 'Martínez Torres',
            fullName: 'Ana Martínez Torres',
            email: 'ana.martinez@example.com',
            phone: '51998765432',
            documentType: 'DNI',
            documentNumber: '55667788'
        }
    }
    const payments4 = generatePayments(loan4Amount, 5.5, 8, loan4StartDate)
    const nextPayment4 = payments4.find(p => p.status !== 'paid')!

    debtors.push({
        id: 'debtor-004',
        customerName: loan4.customer.fullName,
        documentType: loan4.customer.documentType,
        documentNumber: loan4.customer.documentNumber,
        phone: loan4.customer.phone,
        nextPaymentDate: nextPayment4.dueDate,
        nextPaymentAmount: parseFloat(nextPayment4.totalAmount),
        daysUntilPayment: daysBetween(today, new Date(nextPayment4.dueDate)),
        status: 'overdue',
        loanId: loan4.id,
        loan: loan4,
        payments: payments4,
        totals: {
            totalPrincipal: loan4Amount,
            totalInterest: loan4Amount * 0.055 * 8,
            grandTotal: loan4Amount + loan4Amount * 0.055 * 8,
            totalPaid:
                payments4
                    .filter(p => p.status === 'paid')
                    .reduce((sum, p) => sum + parseFloat(p.paidAmount), 0),
            remaining:
                loan4Amount +
                loan4Amount * 0.055 * 8 -
                payments4
                    .filter(p => p.status === 'paid')
                    .reduce((sum, p) => sum + parseFloat(p.paidAmount), 0)
        }
    })

    return debtors
}

// Filter debtors by days configuration
export function filterDebtorsByDays(
    debtors: DebtorInfo[],
    selectedDays: number[]
): DebtorInfo[] {
    if (selectedDays.length === 0) {
        return debtors
    }

    return debtors.filter(debtor => {
        // Include overdue debtors
        if (debtor.status === 'overdue' || debtor.status === 'due_today') {
            return true
        }

        // Check if debtor's days until payment matches any selected day
        return selectedDays.some(days => debtor.daysUntilPayment === days)
    })
}
