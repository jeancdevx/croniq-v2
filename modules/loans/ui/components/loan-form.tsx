'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import type { Cliente } from '@/db/types'
import { cn } from '@/lib/utils'

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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface LoanFormProps {
  clients: Cliente[]
}

export function LoanForm({ clients }: LoanFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [openClientCombobox, setOpenClientCombobox] = useState(false)
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
      const fecha = new Date(fechaDesembolso)
      fecha.setMonth(fecha.getMonth() + 1)
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
                  <Popover
                    open={openClientCombobox}
                    onOpenChange={setOpenClientCombobox}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          role='combobox'
                          className={cn(
                            'justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={isLoading}
                        >
                          {field.value
                            ? (() => {
                                const client = clients.find(
                                  c => c.id === field.value
                                )
                                return client
                                  ? `${client.nombres} ${client.apellidos}`
                                  : 'Seleccionar cliente'
                              })()
                            : 'Seleccionar cliente'}
                          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-[400px] p-0'>
                      <Command>
                        <CommandInput placeholder='Buscar cliente...' />
                        <CommandList>
                          <CommandEmpty>
                            No se encontró el cliente.
                          </CommandEmpty>
                          <CommandGroup>
                            {clients.map(client => (
                              <CommandItem
                                key={client.id}
                                value={`${client.nombres} ${client.apellidos}`}
                                onSelect={() => {
                                  form.setValue('clienteId', client.id)
                                  setOpenClientCombobox(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value === client.id
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {client.nombres} {client.apellidos}
                                <span className='text-muted-foreground ml-2 text-sm'>
                                  (DNI: ********)
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                      Monto entre S/ 100 y S/ 1,000,000
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
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Moneda</CardTitle>
            <CardDescription>
              Selecciona las monedas del préstamo y pago
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-6 md:grid-cols-2'>
            {/* Moneda del Préstamo */}
            <FormField
              control={form.control}
              name='monedaPrestamo'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda del Préstamo *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='PEN'>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold'>S/</span> Soles
                          Peruanos
                        </div>
                      </SelectItem>
                      <SelectItem value='USD'>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold'>$</span> Dólares
                          Americanos
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Moneda de Pago */}
            <FormField
              control={form.control}
              name='monedaPago'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda de Pago *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='PEN'>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold'>S/</span> Soles
                          Peruanos
                        </div>
                      </SelectItem>
                      <SelectItem value='USD'>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold'>$</span> Dólares
                          Americanos
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                            format(new Date(field.value + 'T00:00:00'), 'PPP', {
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
                            ? new Date(field.value + 'T00:00:00')
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
                        disabled={date => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          const maxDate = new Date()
                          maxDate.setDate(maxDate.getDate() + 45)
                          return date < today || date > maxDate
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
