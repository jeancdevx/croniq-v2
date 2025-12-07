'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Bell, Send, MessageCircle, CheckCircle2, Loader2, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { generateMockDebtors } from '@/lib/mock-data'
import type { DebtorInfo } from '@/types/reminder'
// ============================================================================
// CONSTANTS
// ============================================================================
const PRESET_DAYS = [3, 5, 7, 10, 15]

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function MessagesReminderPage() {
    const [selectedDays, setSelectedDays] = useState<number[]>([3, 5])
    const [customDays, setCustomDays] = useState<string>('')
    const [sendingStates, setSendingStates] = useState<Record<string, boolean>>({})
    const [sendingAll, setSendingAll] = useState(false)
    const [debtors, setDebtors] = useState<DebtorInfo[]>([])

    // Get debtors from centralized mock data
    // Use useEffect to avoid Next.js prerender warning with new Date()
    useEffect(() => {
        setDebtors(generateMockDebtors(new Date()))
    }, [])

    // Map DebtorInfo to display format
    const MOCK_DATA = useMemo(() => {
        return debtors.map(debtor => ({
            id: debtor.id,
            nombre: debtor.customerName,
            dni: debtor.documentNumber,
            telefono: debtor.phone,
            deuda: debtor.nextPaymentAmount,
            vencimiento: debtor.nextPaymentDate,
            estado: debtor.status === 'upcoming' ? 'proximo' as const :
                debtor.status === 'due_today' ? 'vence_hoy' as const :
                    'vencido' as const,
            diasRestantes: debtor.daysUntilPayment
        }))
    }, [debtors])

    // Toggle preset day selection
    const toggleDay = (day: number) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort((a, b) => a - b)
        )
    }

    // Handle save configuration
    const handleSaveConfig = () => {
        toast.success('Configuración guardada correctamente', {
            description: `Días seleccionados: ${selectedDays.join(', ')}${customDays ? `, ${customDays}` : ''}`
        })
    }

    // Handle individual send
    const handleSendIndividual = async (clienteId: string, nombre: string) => {
        setSendingStates(prev => ({ ...prev, [clienteId]: true }))

        try {
            // Find the debtor data
            const debtor = debtors.find(d => d.id === clienteId)
            if (!debtor) {
                throw new Error('Deudor no encontrado')
            }

            // Call the API to send WhatsApp message
            const response = await fetch('/api/whatsapp/send-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ debtor }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Error al enviar mensaje')
            }

            toast.success(`Recordatorio enviado a ${nombre}`, {
                description: `WhatsApp enviado al ${debtor.phone}`
            })
        } catch (error) {
            console.error('Error sending WhatsApp:', error)
            toast.error(`Error al enviar a ${nombre}`, {
                description: error instanceof Error ? error.message : 'Error desconocido'
            })
        } finally {
            setSendingStates(prev => ({ ...prev, [clienteId]: false }))
        }
    }

    // Handle send to all
    const handleSendToAll = async () => {
        setSendingAll(true)

        try {
            // Send to all debtors
            const response = await fetch('/api/whatsapp/send-bulk-reminders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    debtorIds: debtors.map(d => d.id),
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Error al enviar mensajes')
            }

            toast.success(`Recordatorios enviados exitosamente`, {
                description: `${result.sent} enviados, ${result.failed} fallidos`
            })
        } catch (error) {
            console.error('Error sending bulk WhatsApp:', error)
            toast.error('Error al enviar recordatorios masivos', {
                description: error instanceof Error ? error.message : 'Error desconocido'
            })
        } finally {
            setSendingAll(false)
        }
    }

    // Get status badge
    const getStatusBadge = (estado: typeof MOCK_DATA[0]['estado']) => {
        switch (estado) {
            case 'vencido':
                return (
                    <Badge className="bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600/30">
                        Vencido
                    </Badge>
                )
            case 'vence_hoy':
                return (
                    <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 hover:bg-orange-600/30">
                        Vence Hoy
                    </Badge>
                )
            case 'proximo':
                return (
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 hover:bg-emerald-600/30">
                        Próximo
                    </Badge>
                )
        }
    }

    // Get days text
    const getDaysText = (diasRestantes: number) => {
        if (diasRestantes < 0) {
            return <span className="text-red-400 font-semibold">{Math.abs(diasRestantes)} días vencido</span>
        }
        if (diasRestantes === 0) {
            return <span className="text-orange-400 font-semibold">Vence hoy</span>
        }
        return <span className="text-emerald-400">En {diasRestantes} días</span>
    }

    // Calculate stats
    const vencidos = MOCK_DATA.filter((c: any) => c.estado === 'vencido')
    const vencenHoy = MOCK_DATA.filter((c: any) => c.estado === 'vence_hoy')
    const proximos = MOCK_DATA.filter((c: any) => c.estado === 'proximo')

    return (
        <div className="min-h-screen bg-zinc-950">
            <div className="container mx-auto px-6 py-6 max-w-[1600px]">
                {/* ============================================================ */}
                {/* HEADER */}
                {/* ============================================================ */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 p-2.5 shadow-lg shadow-emerald-900/50">
                            <Bell className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-100">
                                Recordatorios de Pago
                            </h1>
                            <p className="text-zinc-400 text-sm mt-0.5">
                                Gestiona y envía recordatorios de pago por WhatsApp
                            </p>
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* BARRA UNIFICADA: CONFIGURACIÓN + KPIs */}
                {/* ============================================================ */}
                <Card className="bg-zinc-900/50 border-zinc-800 shadow-lg mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-8">
                            {/* CONFIGURACIÓN (Izquierda) */}
                            <div className="flex items-center gap-6 flex-1">
                                <Label className="text-sm font-medium text-zinc-300 whitespace-nowrap">
                                    Días de anticipación:
                                </Label>
                                <div className="flex items-center gap-4">
                                    {PRESET_DAYS.map(day => (
                                        <div key={day} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`day-${day}`}
                                                checked={selectedDays.includes(day)}
                                                onCheckedChange={() => toggleDay(day)}
                                                className="border-zinc-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                            />
                                            <Label
                                                htmlFor={`day-${day}`}
                                                className="cursor-pointer text-sm font-medium text-zinc-400 hover:text-emerald-400 transition-colors whitespace-nowrap"
                                            >
                                                {day}d
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="custom-days" className="text-sm text-zinc-400 whitespace-nowrap">
                                        Personalizado:
                                    </Label>
                                    <Input
                                        id="custom-days"
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={customDays}
                                        onChange={e => setCustomDays(e.target.value)}
                                        placeholder="1-20"
                                        className="w-20 h-8 bg-zinc-800 border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                                    />
                                </div>
                                <Button
                                    onClick={handleSaveConfig}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md h-8 text-sm"
                                    size="sm"
                                >
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                    Guardar
                                </Button>
                            </div>

                            {/* KPIs COMPACTOS (Derecha) */}
                            <div className="flex items-center gap-6">
                                {/* Vencidos */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-red-400 font-medium">Vencidos:</span>
                                    <span className="text-sm font-bold text-red-400">{vencidos.length}</span>
                                    <span className="text-xs text-zinc-500">
                                        S/{vencidos.reduce((sum: number, c: any) => sum + c.deuda, 0).toFixed(2)}
                                    </span>
                                </div>

                                {/* Vencen Hoy */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-orange-400 font-medium">Vencen Hoy:</span>
                                    <span className="text-sm font-bold text-orange-400">{vencenHoy.length}</span>
                                    <span className="text-xs text-zinc-500">
                                        S/{vencenHoy.reduce((sum: number, c: any) => sum + c.deuda, 0).toFixed(2)}
                                    </span>
                                </div>

                                {/* Próximos */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-emerald-400 font-medium">Próximos:</span>
                                    <span className="text-sm font-bold text-emerald-400">{proximos.length}</span>
                                    <span className="text-xs text-zinc-500">
                                        S/{proximos.reduce((sum: number, c: any) => sum + c.deuda, 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ============================================================ */}
                {/* TABLA DE DEUDORES (100% ANCHO) */}
                {/* ============================================================ */}
                <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl">
                    <CardHeader className="bg-zinc-900/50 border-b border-zinc-800 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-zinc-100 flex items-center gap-2 text-lg">
                                    <MessageCircle className="h-5 w-5 text-emerald-500" />
                                    Deudores ({MOCK_DATA.length})
                                </CardTitle>
                                <CardDescription className="text-zinc-400 text-sm mt-0.5">
                                    Lista de clientes con pagos pendientes
                                </CardDescription>
                            </div>
                            <Button
                                onClick={handleSendToAll}
                                disabled={sendingAll}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50"
                            >
                                {sendingAll ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Enviar a Todos
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70">
                                        <TableHead className="font-semibold text-zinc-300">
                                            Nombre
                                        </TableHead>
                                        <TableHead className="font-semibold text-zinc-300">
                                            DNI
                                        </TableHead>
                                        <TableHead className="font-semibold text-zinc-300">
                                            Teléfono
                                        </TableHead>
                                        <TableHead className="font-semibold text-zinc-300">
                                            Deuda
                                        </TableHead>
                                        <TableHead className="font-semibold text-zinc-300">
                                            Vencimiento
                                        </TableHead>
                                        <TableHead className="font-semibold text-zinc-300">
                                            Estado
                                        </TableHead>
                                        <TableHead className="font-semibold text-zinc-300">
                                            Días
                                        </TableHead>
                                        <TableHead className="text-right font-semibold text-zinc-300">
                                            Acción
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {MOCK_DATA.map(cliente => (
                                        <TableRow
                                            key={cliente.id}
                                            className="border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                                        >
                                            <TableCell className="font-medium text-zinc-100">
                                                {cliente.nombre}
                                            </TableCell>
                                            <TableCell className="text-zinc-400">
                                                {cliente.dni}
                                            </TableCell>
                                            <TableCell className="text-zinc-400">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3.5 w-3.5 text-emerald-500" />
                                                    {cliente.telefono}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-zinc-100">
                                                S/ {cliente.deuda.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-zinc-400">
                                                {new Date(cliente.vencimiento).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(cliente.estado)}
                                            </TableCell>
                                            <TableCell>
                                                {getDaysText(cliente.diasRestantes)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSendIndividual(cliente.id, cliente.nombre)}
                                                    disabled={sendingStates[cliente.id]}
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                                                >
                                                    {sendingStates[cliente.id] ? (
                                                        <>
                                                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                                            Enviando
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                                                            WhatsApp
                                                        </>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
