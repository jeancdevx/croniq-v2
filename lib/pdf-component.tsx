import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const styles = StyleSheet.create({
    page: {
        backgroundColor: '#ffffff',
        color: '#18181b',
        padding: 24,
        fontSize: 12,
        fontFamily: 'Helvetica'
    },
    header: {
        marginBottom: 16,
        textAlign: 'center',
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#e4e4e7'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#18181b',
        marginBottom: 4
    },
    headerSubtitle: {
        fontSize: 10,
        color: '#71717a'
    },
    section: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#f4f4f5',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e4e4e7'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#18181b'
    },
    label: {
        color: '#71717a',
        fontSize: 10,
        marginTop: 4
    },
    value: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#18181b',
        marginBottom: 4
    },
    table: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#e4e4e7',
        borderRadius: 4,
        overflow: 'hidden'
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e4e4e7',
        alignItems: 'center'
    },
    tableHeader: {
        backgroundColor: '#f4f4f5',
        fontWeight: 'bold',
        color: '#18181b',
        paddingTop: 8,
        paddingBottom: 8
    },
    tableCell: {
        flex: 1,
        padding: 6,
        color: '#18181b',
        fontSize: 10,
        textAlign: 'center'
    },
    tableCellLeft: {
        textAlign: 'left'
    },
    tableCellRight: {
        textAlign: 'right'
    },
    totalsRow: {
        backgroundColor: '#f4f4f5',
        fontWeight: 'bold'
    }
})

// Types for props (reuse from LoanScheduleView)
type LoanData = {
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

type PaymentData = {
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

interface LoanSchedulePDFProps {
    loan: LoanData
    payments: PaymentData[]
    totals: {
        totalPrincipal: number
        totalInterest: number
        grandTotal: number
        totalPaid: number
        remaining: number
    }
}

export function LoanSchedulePDF({
    loan,
    payments,
    totals
}: LoanSchedulePDFProps) {
    // Format dates
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const formatLongDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    // Translation helpers
    const translateStatus = (status: string): string => {
        const statusTranslations: Record<string, string> = {
            active: 'Activo',
            completed: 'Completado',
            defaulted: 'En Mora',
            cancelled: 'Cancelado',
            pending: 'Pendiente',
            paid: 'Pagado',
            overdue: 'Atrasado',
            partial: 'Pago Parcial'
        }
        return statusTranslations[status] || status
    }

    return (
        <Document>
            <Page size='A4' style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        CRONOGRAMA DE PAGOS DE PRÉSTAMO
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Croniq - Sistema de Gestión de Préstamos
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Generado el {formatLongDate(new Date().toISOString())}
                    </Text>
                </View>

                {/* Client Info */}
                <View style={styles.section}>
                    <Text style={styles.title}>Información del Cliente</Text>
                    <Text style={styles.label}>Nombre Completo</Text>
                    <Text style={styles.value}>{loan.customer.fullName}</Text>
                    <Text style={styles.label}>Documento</Text>
                    <Text style={styles.value}>
                        {loan.customer.documentType} {loan.customer.documentNumber}
                    </Text>
                    <Text style={styles.label}>Teléfono</Text>
                    <Text style={styles.value}>{loan.customer.phone}</Text>
                    {loan.customer.email && (
                        <>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.value}>{loan.customer.email}</Text>
                        </>
                    )}
                </View>
                {/* Loan Details */}
                <View style={styles.section}>
                    <Text style={styles.title}>Detalles del Préstamo</Text>
                    <Text style={styles.label}>ID del Préstamo</Text>
                    <Text style={styles.value}>{loan.id}</Text>
                    <Text style={styles.label}>Monto del Préstamo</Text>
                    <Text style={styles.value}>
                        {loan.amount} {loan.loanCurrency}
                    </Text>
                    <Text style={styles.label}>Tasa de Interés</Text>
                    <Text style={styles.value}>
                        {loan.interestRate}%{' '}
                        {loan.interestRateType === 'monthly' ? 'Mensual' : 'Anual'}
                    </Text>
                    <Text style={styles.label}>Cuotas</Text>
                    <Text style={styles.value}>{loan.installments}</Text>
                    <Text style={styles.label}>Fecha de Desembolso</Text>
                    <Text style={styles.value}>
                        {formatLongDate(loan.disbursementDate)}
                    </Text>
                    <Text style={styles.label}>Estado</Text>
                    <Text style={styles.value}>{translateStatus(loan.status)}</Text>
                </View>
                {/* Payment Schedule Table */}
                <View style={styles.section}>
                    <Text style={styles.title}>Cronograma de Pagos</Text>
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={[styles.tableCell, styles.tableCellLeft]}>
                                Cuota
                            </Text>
                            <Text style={styles.tableCell}>Vencimiento</Text>
                            <Text style={[styles.tableCell, styles.tableCellRight]}>
                                Capital
                            </Text>
                            <Text style={[styles.tableCell, styles.tableCellRight]}>
                                Interés
                            </Text>
                            <Text style={[styles.tableCell, styles.tableCellRight]}>
                                Mora
                            </Text>
                            <Text style={[styles.tableCell, styles.tableCellRight]}>
                                Total
                            </Text>
                            <Text style={styles.tableCell}>Estado</Text>
                        </View>
                        {/* Table Rows */}
                        {payments.map(p => (
                            <View style={styles.tableRow} key={p.id}>
                                <Text style={[styles.tableCell, styles.tableCellLeft]}>
                                    {p.installmentNumber}
                                </Text>
                                <Text style={styles.tableCell}>{formatDate(p.dueDate)}</Text>
                                <Text style={[styles.tableCell, styles.tableCellRight]}>
                                    {p.principalAmount}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCellRight]}>
                                    {p.interestAmount}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCellRight]}>
                                    {parseFloat(p.lateFeeAmount) > 0 ? p.lateFeeAmount : '-'}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCellRight]}>
                                    {p.totalAmount}
                                </Text>
                                <Text style={styles.tableCell}>
                                    {translateStatus(p.status)}
                                </Text>
                            </View>
                        ))}
                        {/* Totals Row */}
                        <View style={[styles.tableRow, styles.totalsRow]}>
                            <Text style={[styles.tableCell, styles.tableCellLeft]}>
                                TOTALES
                            </Text>
                            <Text style={styles.tableCell}></Text>
                            <Text style={[styles.tableCell, styles.tableCellRight]}>
                                {totals.totalPrincipal.toFixed(2)}
                            </Text>
                            <Text style={[styles.tableCell, styles.tableCellRight]}>
                                {totals.totalInterest.toFixed(2)}
                            </Text>
                            <Text style={[styles.tableCell, styles.tableCellRight]}>
                                {payments
                                    .reduce((sum, p) => sum + parseFloat(p.lateFeeAmount), 0)
                                    .toFixed(2)}
                            </Text>
                            <Text style={[styles.tableCell, styles.tableCellRight]}>
                                {totals.grandTotal.toFixed(2)}
                            </Text>
                            <Text style={styles.tableCell}></Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
