'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { CalendarIcon, Loader2 } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { ClientSearchCombobox } from '@/modules/clients/ui/client-search-combobox'
import { createLoanSchema } from '@/modules/loans/schemas'
import { createLoan } from '@/modules/loans/server'
import type { LoanFormData } from '@/modules/loans/types'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

export function LoanForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [openCalendar, setOpenCalendar] = useState(false)

  const form = useForm<LoanFormData>({
    resolver: zodResolver(createLoanSchema),
    defaultValues: {
      clienteId: '',
      montoSolicitado: 10000,
      tea: 0.22,
      numeroCuotas: 12,
      monedaPrestamo: 'PEN',
      monedaPago: 'PEN',
      fechaDesembolso: new Date().toISOString().split('T')[0],
      diaVencimiento: new Date().getDate()
    }
  })

  // Calcular automáticamente el día de vencimiento cuando cambia la fecha
  const fechaDesembolso = form.watch('fechaDesembolso')

  useEffect(() => {
    if (fechaDesembolso) {
      // IMPORTANTE: Agregar T12:00:00 para evitar que JavaScript interprete como UTC midnight
      // lo cual restaría un día en Perú (UTC-5)
      const fecha = new Date(fechaDesembolso + 'T12:00:00')
      const diaVencimiento = fecha.getDate()
      form.setValue('diaVencimiento', diaVencimiento)
    }
  }, [fechaDesembolso, form])

  const onSubmit = async (data: LoanFormData) => {
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('clienteId', data.clienteId)
      formData.append('montoSolicitado', data.montoSolicitado.toString())
      formData.append('tea', data.tea.toString())
      formData.append('numeroCuotas', data.numeroCuotas.toString())
      formData.append('monedaPrestamo', data.monedaPrestamo)
      formData.append('monedaPago', data.monedaPago)
      formData.append('fechaDesembolso', data.fechaDesembolso)
      formData.append('diaVencimiento', data.diaVencimiento.toString())

      const result = await createLoan(formData)

      if (result.success) {
        toast.success('¡Préstamo creado!', {
          description: result.data?.message
        })
        router.push(`/loans/${result.data?.prestamoId}`)
      } else {
        toast.error('Error al crear préstamo', {
          description: result.error
        })
      }
    } catch {
      toast.error('Error', {
        description: 'Ocurrió un error inesperado'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
            <CardDescription>
              Selecciona el cliente para el préstamo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name='clienteId'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Cliente *</FormLabel>
                  <FormControl>
                    <ClientSearchCombobox
                      value={field.value}
                      onSelect={value => field.onChange(value)}
                      disabled={isLoading}
                      placeholder='Seleccionar cliente'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Detalles del Préstamo */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Préstamo</CardTitle>
            <CardDescription>
              Configura el monto, plazo y tasa de interés
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid gap-6 md:grid-cols-2'>
              {/* Monto */}
              <FormField
                control={form.control}
                name='montoSolicitado'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto del Préstamo *</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <span className='text-muted-foreground absolute top-2.5 left-3'>
                          S/
                        </span>
                        <Input
                          type='number'
                          step='0.01'
                          className='pl-10'
                          placeholder='10,000.00'
                          disabled={isLoading}
                          value={field.value || ''}
                          onChange={e => {
                            const value = e.target.value
                            field.onChange(
                              value === '' ? '' : parseFloat(value)
                            )
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Monto entre S/ 5 y S/ 1,000,000
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TEA como porcentaje */}
              <FormField
                control={form.control}
                name='tea'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasa Anual (TEA) *</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          type='number'
                          step='0.01'
                          className='pr-8'
                          placeholder='22'
                          disabled={isLoading}
                          value={
                            field.value ? (field.value * 100).toString() : ''
                          }
                          onChange={e => {
                            const value = e.target.value
                            if (value === '') {
                              field.onChange('')
                            } else {
                              const percentage = parseFloat(value)
                              if (!isNaN(percentage)) {
                                field.onChange(percentage / 100)
                              }
                            }
                          }}
                        />
                        <span className='text-muted-foreground absolute top-2.5 right-3'>
                          %
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Tasa Efectiva Anual (ej: 22%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className='grid gap-6 md:grid-cols-2'>
              {/* Número de Cuotas */}
              <FormField
                control={form.control}
                name='numeroCuotas'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plazo (meses) *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={1}
                        max={72}
                        placeholder='12'
                        disabled={isLoading}
                        value={field.value || ''}
                        onChange={e => {
                          const value = e.target.value
                          field.onChange(value === '' ? '' : parseInt(value))
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Ingrese el número de meses (1-72)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Monedas */}
        {/* Configuración de Moneda - Solo PEN */}
        <Card>
          <CardHeader>
            <CardTitle>Moneda del Préstamo</CardTitle>
            <CardDescription>
              Todos los préstamos se manejan en Soles Peruanos (PEN)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='bg-muted/50 flex items-center gap-3 rounded-lg border p-4'>
              <span className='text-2xl font-bold'>S/</span>
              <div>
                <p className='font-medium'>Soles Peruanos</p>
                <p className='text-muted-foreground text-sm'>
                  Moneda única del sistema
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fecha de Desembolso */}
        <Card>
          <CardHeader>
            <CardTitle>Fecha de Desembolso</CardTitle>
            <CardDescription>
              Selecciona cuándo se entregará el préstamo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name='fechaDesembolso'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Fecha de Desembolso *</FormLabel>
                  <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          className={cn(
                            'w-full pl-3 text-left font-normal md:w-[280px]',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={isLoading}
                        >
                          {field.value ? (
                            format(new Date(field.value + 'T12:00:00'), 'PPP', {
                              locale: es
                            })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={
                          field.value
                            ? new Date(field.value + 'T12:00:00')
                            : undefined
                        }
                        onSelect={date => {
                          if (date) {
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              '0'
                            )
                            const day = String(date.getDate()).padStart(2, '0')
                            const dateString = `${year}-${month}-${day}`
                            field.onChange(dateString)
                            setOpenCalendar(false)
                          }
                        }}
                        disabled={_date => {
                          // Permitir cualquier fecha (pasada o futura)
                          // - Pasadas: para testing de moras
                          // - Futuras: para préstamos programados
                          return false
                        }}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Botones */}
        <div className='flex justify-end gap-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.back()}
            disabled={isLoading}
            size='lg'
          >
            Cancelar
          </Button>
          <Button type='submit' disabled={isLoading} size='lg'>
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Crear Préstamo
          </Button>
        </div>
      </form>
    </Form>
  )
}
