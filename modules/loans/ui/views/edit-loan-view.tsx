'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { CalendarIcon } from 'lucide-react'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

import type { PrestamoConCuotas } from '@/db/types'
import { cn } from '@/lib/utils'

import { updateLoan } from '@/modules/loans/server'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface EditLoanViewProps {
  loan: PrestamoConCuotas
}

export function EditLoanView({ loan }: EditLoanViewProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado del formulario
  const [numeroCuotas, setNumeroCuotas] = useState(loan.numeroCuotas)
  const [fechaDesembolso, setFechaDesembolso] = useState<Date>(
    new Date(loan.fechaDesembolso + 'T00:00:00')
  )
  const [monedaPago, setMonedaPago] = useState(loan.monedaPago)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('numeroCuotas', numeroCuotas.toString())
      formData.append('fechaDesembolso', format(fechaDesembolso, 'yyyy-MM-dd'))
      formData.append('monedaPago', monedaPago)

      const result = await updateLoan(loan.id, formData)

      if (result.success) {
        toast.success('¡Préstamo actualizado!', {
          description: 'Los cambios se han guardado correctamente'
        })
        router.push(`/loans/${loan.id}`)
        router.refresh()
      } else {
        toast.error('Error', {
          description: result.error
        })
      }
    } catch {
      toast.error('Error', {
        description: 'Ocurrió un error inesperado'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='flex flex-col gap-6 p-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Editar Préstamo DRAFT</h1>
          <p className='text-muted-foreground mt-1'>
            Modifica el plazo, fecha de desembolso o moneda de pago
          </p>
        </div>

        <Link href={`/loans/${loan.id}`}>
          <Button variant='outline'>Cancelar</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Información No Editable */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Préstamo (No Editable)</CardTitle>
            <CardDescription>
              Estos datos no se pueden modificar
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-3'>
            <div>
              <Label className='text-muted-foreground'>Cliente</Label>
              <p className='font-medium'>
                {loan.cliente
                  ? `${loan.cliente.nombres} ${loan.cliente.apellidos}`
                  : '-'}
              </p>
            </div>
            <div>
              <Label className='text-muted-foreground'>Monto Solicitado</Label>
              <p className='font-medium'>
                {new Intl.NumberFormat('es-PE', {
                  style: 'currency',
                  currency: loan.monedaPrestamo
                }).format(parseFloat(loan.montoSolicitado))}
              </p>
            </div>
            <div>
              <Label className='text-muted-foreground'>TEA</Label>
              <p className='font-medium'>
                {(parseFloat(loan.tea) * 100).toFixed(2)}%
              </p>
            </div>
            <div>
              <Label className='text-muted-foreground'>Moneda Préstamo</Label>
              <p className='font-medium'>{loan.monedaPrestamo}</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                (No se puede cambiar)
              </p>
            </div>
            <div>
              <Label className='text-muted-foreground'>
                Día de Vencimiento
              </Label>
              <p className='font-medium'>Día {loan.diaVencimiento}</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                (Se calcula automáticamente de la fecha de desembolso)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Campos Editables */}
        <Card>
          <CardHeader>
            <CardTitle>Campos Editables</CardTitle>
            <CardDescription>
              Modifica estos campos y el sistema recalculará las cuotas
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-6 md:grid-cols-2'>
            {/* Plazo */}
            <div className='space-y-2'>
              <Label htmlFor='numeroCuotas'>
                Plazo (meses) <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='numeroCuotas'
                type='number'
                min={1}
                max={72}
                value={numeroCuotas}
                onChange={e => setNumeroCuotas(parseInt(e.target.value) || 1)}
                required
              />
              <p className='text-muted-foreground text-xs'>
                Entre 1 y 72 meses
              </p>
            </div>

            {/* Fecha Desembolso */}
            <div className='space-y-2'>
              <Label>
                Fecha de Desembolso <span className='text-destructive'>*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !fechaDesembolso && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {fechaDesembolso ? (
                      format(fechaDesembolso, 'PPP', { locale: es })
                    ) : (
                      <span>Selecciona una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={fechaDesembolso}
                    onSelect={date => date && setFechaDesembolso(date)}
                    disabled={date => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const maxDate = new Date()
                      maxDate.setDate(maxDate.getDate() + 45)
                      return date < today || date > maxDate
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className='text-muted-foreground text-xs'>
                Máximo 45 días desde hoy. El día de vencimiento se calculará
                automáticamente.
              </p>
            </div>

            {/* Moneda de Pago */}
            <div className='space-y-2'>
              <Label htmlFor='monedaPago'>
                Moneda de Pago <span className='text-destructive'>*</span>
              </Label>
              <Select value={monedaPago} onValueChange={setMonedaPago}>
                <SelectTrigger id='monedaPago'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='PEN'>Soles (PEN)</SelectItem>
                  <SelectItem value='USD'>Dólares (USD)</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-muted-foreground text-xs'>
                {loan.monedaPrestamo !== monedaPago
                  ? `Cambiando de ${loan.monedaPrestamo} → ${monedaPago}`
                  : 'Igual a moneda de préstamo'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botones */}
        <div className='flex justify-end gap-2'>
          <Link href={`/loans/${loan.id}`}>
            <Button type='button' variant='outline' disabled={isSubmitting}>
              Cancelar
            </Button>
          </Link>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}
