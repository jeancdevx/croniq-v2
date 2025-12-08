'use client'

import { useState } from 'react'

import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { Cliente } from '@/db/types'
import { cn } from '@/lib/utils'

import { createLoan } from '@/modules/loans/actions'
import { obtenerFechaHoy } from '@/modules/loans/utils/loan-calculations'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'

const formSchema = z.object({
  clienteId: z.string().min(1, 'Selecciona un cliente'),
  monto: z.number().min(1, 'El monto debe ser mayor a 0'),
  plazo: z.number().int().min(1, 'El plazo debe ser al menos 1 mes'),
  tasaAnual: z.number().min(0.01, 'La tasa debe ser mayor a 0'),
  fechaDesembolso: z.string()
})

type FormValues = z.infer<typeof formSchema>

interface RegistroPrestamoFormProps {
  clientes: Cliente[]
}

export function RegistroPrestamoForm({ clientes }: RegistroPrestamoFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fechaHoy = obtenerFechaHoy()

  // Debug log to ensure component is updated
  console.log(
    'RegistroPrestamoForm renderizado con',
    clientes.length,
    'clientes'
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clienteId: '',
      monto: 0,
      plazo: 12,
      tasaAnual: 20,
      fechaDesembolso: fechaHoy
    }
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      const result = await createLoan({
        clienteId: data.clienteId,
        monto: data.monto,
        plazo: data.plazo,
        tasaAnual: data.tasaAnual,
        fechaDesembolso: data.fechaDesembolso
      })

      if (result.success) {
        toast.success('Préstamo registrado exitosamente')
        form.reset({
          clienteId: '',
          monto: 0,
          plazo: 12,
          tasaAnual: 20,
          fechaDesembolso: fechaHoy
        })
      } else {
        toast.error(result.error || 'Error al registrar el préstamo')
      }
    } catch (error) {
      console.error(error)
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className='border-border/40 bg-card/50'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>
          📋 Registrar Nuevo Préstamo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Información del Cliente */}
            <div className='border-border/40 bg-muted/20 space-y-4 rounded-lg border p-4'>
              <h3 className='text-foreground text-sm font-semibold'>
                👤 Información del Cliente
              </h3>

              <FormField
                control={form.control}
                name='clienteId'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Cliente</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            aria-expanded={open}
                            className={cn(
                              'w-full justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? clientes.find(
                                  cliente => cliente.id === field.value
                                )?.nombres +
                                ' ' +
                                clientes.find(
                                  cliente => cliente.id === field.value
                                )?.apellidos
                              : 'Seleccionar cliente...'}
                            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-[400px] p-0'>
                        <Command>
                          <CommandInput placeholder='Buscar cliente...' />
                          <CommandList>
                            <CommandEmpty>No se encontró cliente.</CommandEmpty>
                            <CommandGroup>
                              {clientes.map(cliente => (
                                <CommandItem
                                  value={`${cliente.nombres} ${cliente.apellidos} ${cliente.dni}`}
                                  key={cliente.id}
                                  onSelect={() => {
                                    form.setValue('clienteId', cliente.id)
                                    setOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      cliente.id === field.value
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                  <div className='flex flex-col'>
                                    <span>
                                      {cliente.nombres} {cliente.apellidos}
                                    </span>
                                    <span className='text-muted-foreground text-xs'>
                                      DNI: {cliente.dni}
                                    </span>
                                  </div>
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
            </div>

            {/* Detalles del Préstamo */}
            <div className='border-border/40 bg-muted/20 space-y-4 rounded-lg border p-4'>
              <h3 className='text-foreground text-sm font-semibold'>
                💰 Detalles del Préstamo
              </h3>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='monto'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto del Préstamo (S/.)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          className='border-border/60 bg-background/50'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='fechaDesembolso'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Desembolso</FormLabel>
                      <FormControl>
                        <Input
                          type='date'
                          {...field}
                          className='border-border/60 bg-background/50'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='plazo'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plazo (meses)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          {...field}
                          onChange={e =>
                            field.onChange(parseInt(e.target.value))
                          }
                          className='border-border/60 bg-background/50'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='tasaAnual'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tasa de Interés Anual (%)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          className='border-border/60 bg-background/50'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <Label className='text-sm font-medium'>Tipo de Cálculo</Label>
                <Input
                  value='Amortizado (Cuotas Fijas)'
                  readOnly
                  className='border-border/60 bg-muted/40 mt-1.5'
                />
                <p className='text-muted-foreground mt-1.5 text-xs'>
                  Este cálculo utiliza el sistema de cuotas mensuales fijas.
                </p>
              </div>
            </div>

            <Button
              type='submit'
              className='w-full bg-emerald-600 hover:bg-emerald-700'
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Registrando...
                </>
              ) : (
                'Registrar Préstamo'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
