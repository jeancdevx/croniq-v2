'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { Send, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import type { DebtorInfo } from '@/types/reminder'

interface DebtorsTableProps {
    debtors: DebtorInfo[]
}

export function DebtorsTable({ debtors }: DebtorsTableProps) {
    const [sendingStates, setSendingStates] = useState<
        Record<string, 'idle' | 'sending' | 'success' | 'error'>
    >({})

    const handleSendReminder = async (debtor: DebtorInfo) => {
        setSendingStates(prev => ({ ...prev, [debtor.id]: 'sending' }))

        try {
            const response = await fetch('/api/whatsapp/send-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ debtor })
            })

            if (!response.ok) {
                throw new Error('Failed to send reminder')
            }

            setSendingStates(prev => ({ ...prev, [debtor.id]: 'success' }))

            // Reset to idle after 3 seconds
            setTimeout(() => {
                setSendingStates(prev => ({ ...prev, [debtor.id]: 'idle' }))
            }, 3000)
        } catch (error) {
            console.error('Error sending reminder:', error)
            setSendingStates(prev => ({ ...prev, [debtor.id]: 'error' }))

            // Reset to idle after 3 seconds
            setTimeout(() => {
                setSendingStates(prev => ({ ...prev, [debtor.id]: 'idle' }))
            }, 3000)
        }
    }

    const getStatusBadge = (status: DebtorInfo['status']) => {
        switch (status) {
            case 'overdue':
                return (
                    <Badge variant="destructive" className="bg-red-600">
                        Vencido
                    </Badge>
                )
            case 'due_today':
                return (
                    <Badge variant="default" className="bg-orange-600">
                        Vence Hoy
                    </Badge>
                )
            case 'upcoming':
                return (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Próximo
                    </Badge>
                )
        }
    }

    const getDaysText = (debtor: DebtorInfo) => {
        if (debtor.status === 'overdue') {
            return (
                <span className="font-semibold text-red-600">
                    {Math.abs(debtor.daysUntilPayment)} días vencido
                </span>
            )
        }
        if (debtor.status === 'due_today') {
            return <span className="font-semibold text-orange-600">Hoy</span>
        }
        return (
            <span className="text-green-700">
                En {debtor.daysUntilPayment} días
            </span>
        )
    }

    const getSendButtonContent = (debtorId: string) => {
        const state = sendingStates[debtorId] || 'idle'

        switch (state) {
            case 'sending':
                return (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                    </>
                )
            case 'success':
                return (
                    <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Enviado
                    </>
                )
            case 'error':
                return (
                    <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Error
                    </>
                )
            default:
                return (
                    <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar
                    </>
                )
        }
    }

    if (debtors.length === 0) {
        return (
            <Card className="border-green-200">
                <CardContent className="flex h-48 items-center justify-center">
                    <p className="text-gray-500">
                        No hay deudores que coincidan con los criterios seleccionados
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-green-200 bg-white">
            <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-white">
                <CardTitle className="text-green-800">
                    Deudores ({debtors.length})
                </CardTitle>
                <CardDescription className="text-green-600">
                    Lista de clientes con pagos pendientes o próximos
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-green-100 bg-green-50/50">
                                <TableHead className="font-semibold text-green-800">
                                    Cliente
                                </TableHead>
                                <TableHead className="font-semibold text-green-800">
                                    Documento
                                </TableHead>
                                <TableHead className="font-semibold text-green-800">
                                    Teléfono
                                </TableHead>
                                <TableHead className="font-semibold text-green-800">
                                    Próximo Pago
                                </TableHead>
                                <TableHead className="font-semibold text-green-800">
                                    Monto
                                </TableHead>
                                <TableHead className="font-semibold text-green-800">
                                    Estado
                                </TableHead>
                                <TableHead className="font-semibold text-green-800">
                                    Días
                                </TableHead>
                                <TableHead className="text-right font-semibold text-green-800">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {debtors.map(debtor => (
                                <TableRow
                                    key={debtor.id}
                                    className="border-green-100 hover:bg-green-50/30"
                                >
                                    <TableCell className="font-medium">
                                        {debtor.customerName}
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                        {debtor.documentType} {debtor.documentNumber}
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                        {debtor.phone}
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                        {new Date(
                                            debtor.nextPaymentDate
                                        ).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </TableCell>
                                    <TableCell className="font-semibold text-gray-900">
                                        S/ {debtor.nextPaymentAmount.toFixed(2)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(debtor.status)}</TableCell>
                                    <TableCell>{getDaysText(debtor)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            onClick={() => handleSendReminder(debtor)}
                                            disabled={
                                                sendingStates[debtor.id] === 'sending'
                                            }
                                            className={`
                                                ${sendingStates[debtor.id] === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
                                                ${sendingStates[debtor.id] === 'error' ? 'bg-red-600 hover:bg-red-700' : ''}
                                                ${!sendingStates[debtor.id] || sendingStates[debtor.id] === 'idle' ? 'bg-green-600 hover:bg-green-700' : ''}
                                            `}
                                        >
                                            {getSendButtonContent(debtor.id)}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
