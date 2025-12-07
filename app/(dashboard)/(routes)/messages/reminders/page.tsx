'use client'

import { useEffect, useMemo, useState } from 'react'

import { CheckCircle2, Loader2, MessageCircle, Phone, Send } from 'lucide-react'

import { toast } from 'sonner'

import type { DebtorInfo } from '@/types/reminder'
import { generateMockDebtors } from '@/lib/mock-data'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

// ============================================================================
// TYPES
// ============================================================================
type DebtorDisplay = {
  id: string
  nombre: string
  dni: string
  telefono: string
  deuda: number
  vencimiento: string
  estado: 'vencido' | 'vence_hoy' | 'proximo'
  diasRestantes: number
}

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
  const [sendingStates, setSendingStates] = useState<Record<string, boolean>>(
    {}
  )
  const [sendingAll, setSendingAll] = useState(false)
  const [debtors, setDebtors] = useState<DebtorInfo[]>([])

  // Get debtors from centralized mock data
  // Use useEffect to avoid Next.js prerender warning with new Date()
  useEffect(() => {
    setDebtors(generateMockDebtors(new Date()))
  }, [])

  // Map DebtorInfo to display format
  const MOCK_DATA = useMemo<DebtorDisplay[]>(() => {
    return debtors.map(debtor => ({
      id: debtor.id,
      nombre: debtor.customerName,
      dni: debtor.documentNumber,
      telefono: debtor.phone,
      deuda: debtor.nextPaymentAmount,
      vencimiento: debtor.nextPaymentDate,
      estado:
        debtor.status === 'upcoming'
          ? ('proximo' as const)
          : debtor.status === 'due_today'
            ? ('vence_hoy' as const)
            : ('vencido' as const),
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ debtor })
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
        description:
          error instanceof Error ? error.message : 'Error desconocido'
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          debtorIds: debtors.map(d => d.id)
        })
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
        description:
          error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setSendingAll(false)
    }
  }

  // Get status badge
  const getStatusBadge = (estado: (typeof MOCK_DATA)[0]['estado']) => {
    switch (estado) {
      case 'vencido':
        return (
          <Badge className='border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400'>
            Vencido
          </Badge>
        )
      case 'vence_hoy':
        return (
          <Badge className='border-orange-500/20 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400'>
            Vence Hoy
          </Badge>
        )
      case 'proximo':
        return (
          <Badge className='border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'>
            Próximo
          </Badge>
        )
    }
  }

  // Get days text
  const getDaysText = (diasRestantes: number) => {
    if (diasRestantes < 0) {
      return (
        <span className='font-semibold text-red-600 dark:text-red-400'>
          {Math.abs(diasRestantes)} días vencido
        </span>
      )
    }
    if (diasRestantes === 0) {
      return (
        <span className='font-semibold text-orange-600 dark:text-orange-400'>
          Vence hoy
        </span>
      )
    }
    return (
      <span className='text-emerald-600 dark:text-emerald-400'>
        En {diasRestantes} días
      </span>
    )
  }

  // Calculate stats
  const vencidos = MOCK_DATA.filter(c => c.estado === 'vencido')
  const vencenHoy = MOCK_DATA.filter(c => c.estado === 'vence_hoy')
  const proximos = MOCK_DATA.filter(c => c.estado === 'proximo')

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
      {/* ============================================================ */}
      {/* BARRA UNIFICADA: CONFIGURACIÓN + KPIs */}
      {/* ============================================================ */}
      <Card className='border-border shadow-sm'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between gap-8'>
            {/* CONFIGURACIÓN (Izquierda) */}
            <div className='flex flex-1 items-center gap-6'>
              <Label className='text-foreground text-sm font-medium whitespace-nowrap'>
                Días de anticipación:
              </Label>
              <div className='flex items-center gap-4'>
                {PRESET_DAYS.map(day => (
                  <div key={day} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`day-${day}`}
                      checked={selectedDays.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    <Label
                      htmlFor={`day-${day}`}
                      className='text-muted-foreground cursor-pointer text-sm font-medium whitespace-nowrap transition-colors hover:text-emerald-600 dark:hover:text-emerald-400'
                    >
                      {day}d
                    </Label>
                  </div>
                ))}
              </div>
              <div className='flex items-center gap-2'>
                <Label
                  htmlFor='custom-days'
                  className='text-muted-foreground text-sm whitespace-nowrap'
                >
                  Personalizado:
                </Label>
                <Input
                  id='custom-days'
                  type='number'
                  min='1'
                  max='20'
                  value={customDays}
                  onChange={e => setCustomDays(e.target.value)}
                  placeholder='1-20'
                  className='h-8 w-20 text-sm'
                />
              </div>
              <Button
                onClick={handleSaveConfig}
                className='h-8 bg-emerald-600 text-sm text-white shadow-md hover:bg-emerald-500'
                size='sm'
              >
                <CheckCircle2 className='mr-1.5 h-3.5 w-3.5' />
                Guardar
              </Button>
            </div>

            {/* KPIs COMPACTOS (Derecha) */}
            <div className='flex items-center gap-6'>
              {/* Vencidos */}
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-red-600 dark:text-red-400'>
                  Vencidos:
                </span>
                <span className='text-sm font-bold text-red-600 dark:text-red-400'>
                  {vencidos.length}
                </span>
                <span className='text-muted-foreground text-xs'>
                  S/{vencidos.reduce((sum, c) => sum + c.deuda, 0).toFixed(2)}
                </span>
              </div>

              {/* Vencen Hoy */}
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-orange-600 dark:text-orange-400'>
                  Vencen Hoy:
                </span>
                <span className='text-sm font-bold text-orange-600 dark:text-orange-400'>
                  {vencenHoy.length}
                </span>
                <span className='text-muted-foreground text-xs'>
                  S/{vencenHoy.reduce((sum, c) => sum + c.deuda, 0).toFixed(2)}
                </span>
              </div>

              {/* Próximos */}
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-emerald-600 dark:text-emerald-400'>
                  Próximos:
                </span>
                <span className='text-sm font-bold text-emerald-600 dark:text-emerald-400'>
                  {proximos.length}
                </span>
                <span className='text-muted-foreground text-xs'>
                  S/{proximos.reduce((sum, c) => sum + c.deuda, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* TABLA DE DEUDORES (100% ANCHO) */}
      {/* ============================================================ */}
      <Card className='border-border shadow-sm'>
        <CardHeader className='border-b py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-foreground flex items-center gap-2 text-lg'>
                <MessageCircle className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
                Deudores ({MOCK_DATA.length})
              </CardTitle>
              <CardDescription className='text-muted-foreground mt-0.5 text-sm'>
                Lista de clientes con pagos pendientes
              </CardDescription>
            </div>
            <Button
              onClick={handleSendToAll}
              disabled={sendingAll}
              className='bg-emerald-600 text-white shadow-md hover:bg-emerald-500'
            >
              {sendingAll ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className='mr-2 h-4 w-4' />
                  Enviar a Todos
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-muted/50'>
                  <TableHead className='text-muted-foreground font-semibold'>
                    Nombre
                  </TableHead>
                  <TableHead className='text-muted-foreground font-semibold'>
                    DNI
                  </TableHead>
                  <TableHead className='text-muted-foreground font-semibold'>
                    Teléfono
                  </TableHead>
                  <TableHead className='text-muted-foreground font-semibold'>
                    Deuda
                  </TableHead>
                  <TableHead className='text-muted-foreground font-semibold'>
                    Vencimiento
                  </TableHead>
                  <TableHead className='text-muted-foreground font-semibold'>
                    Estado
                  </TableHead>
                  <TableHead className='text-muted-foreground font-semibold'>
                    Días
                  </TableHead>
                  <TableHead className='text-muted-foreground text-right font-semibold'>
                    Acción
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_DATA.map(cliente => (
                  <TableRow
                    key={cliente.id}
                    className='hover:bg-muted/50 transition-colors'
                  >
                    <TableCell className='text-foreground font-medium'>
                      {cliente.nombre}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {cliente.dni}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <Phone className='h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400' />
                        {cliente.telefono}
                      </div>
                    </TableCell>
                    <TableCell className='text-foreground font-semibold'>
                      S/ {cliente.deuda.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {new Date(cliente.vencimiento).toLocaleDateString(
                        'es-ES',
                        {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(cliente.estado)}</TableCell>
                    <TableCell>{getDaysText(cliente.diasRestantes)}</TableCell>
                    <TableCell className='text-right'>
                      <Button
                        size='sm'
                        onClick={() =>
                          handleSendIndividual(cliente.id, cliente.nombre)
                        }
                        disabled={sendingStates[cliente.id]}
                        className='bg-emerald-600 text-white shadow-md hover:bg-emerald-500'
                      >
                        {sendingStates[cliente.id] ? (
                          <>
                            <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                            Enviando
                          </>
                        ) : (
                          <>
                            <MessageCircle className='mr-1.5 h-3.5 w-3.5' />
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
  )
}
