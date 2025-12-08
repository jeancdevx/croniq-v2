'use client'

import { useState } from 'react'

import { Check, ChevronsUpDown, Loader2, Send } from 'lucide-react'

import {
  generatePaymentLink,
  resendPaymentLink
} from '@/minibackend/payments/actions'
import { zodResolver } from '@hookform/resolvers/zod'
import { QRCodeCanvas } from 'qrcode.react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { Cliente } from '@/lib/db/types'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
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

const formSchema = z.object({
  clientId: z.string().min(1, {
    message: 'Por favor seleccione un cliente.'
  }),
  amount: z.coerce.number().min(1, {
    message: 'El monto debe ser mayor a 0.'
  }),
  concept: z.string().min(3, {
    message: 'El concepto debe tener al menos 3 caracteres.'
  })
})

interface PaymentsFormProps {
  clients?: Cliente[]
}

export function PaymentsForm({ clients = [] }: PaymentsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<{
    url: string
    clientId: string
    concept: string
    amount: number
  } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: '',
      amount: 0,
      concept: ''
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const selectedClient = clients.find(client => client.id === values.clientId)

    if (!selectedClient) {
      toast.error('Cliente no encontrado')
      return
    }

    if (!selectedClient.email) {
      toast.error('El cliente seleccionado no tiene un email registrado')
      return
    }

    setIsLoading(true)
    try {
      const result = await generatePaymentLink({
        email: selectedClient.email,
        amount: values.amount,
        concept: values.concept,
        clientId: selectedClient.id
      })

      if (result.success && result.url) {
        toast.success('Link de pago generado exitosamente')
        setGeneratedLink({
          url: result.url,
          clientId: selectedClient.id,
          concept: values.concept,
          amount: values.amount
        })
      } else {
        toast.error(result.error || 'Error al generar el link de pago')
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendWhatsapp = async () => {
    if (!generatedLink) return

    setIsLoading(true)
    try {
      const result = await resendPaymentLink({
        clientId: generatedLink.clientId,
        url: generatedLink.url,
        concept: generatedLink.concept,
        amount: generatedLink.amount
      })

      if (result.success) {
        toast.success('Link reenviado por WhatsApp exitosamente')
      } else {
        toast.error(result.error || 'Error al reenviar el link')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al reenviar el link')
    } finally {
      setIsLoading(false)
    }
  }

  if (generatedLink) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Check className='h-6 w-6 text-green-500' />
            Link Generado Exitosamente
          </CardTitle>
          <CardDescription>
            El link de pago ha sido generado y enviado al cliente.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center gap-6 pt-4'>
          <div className='rounded-lg border bg-white p-4 shadow-sm'>
            <QRCodeCanvas value={generatedLink.url} size={200} />
          </div>

          <div className='space-y-2 text-center'>
            <p className='text-lg font-medium'>{generatedLink.concept}</p>
            <p className='text-muted-foreground'>
              Monto: S/ {generatedLink.amount.toFixed(2)}
            </p>
          </div>

          <div className='flex w-full flex-col gap-3 sm:flex-row sm:justify-center'>
            <Button
              variant='outline'
              onClick={handleResendWhatsapp}
              disabled={isLoading}
              className='w-full sm:w-auto'
            >
              {isLoading ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Send className='mr-2 h-4 w-4' />
              )}
              Reenviar por WhatsApp
            </Button>

            <Button
              variant='default'
              onClick={() => {
                setGeneratedLink(null)
                form.reset()
              }}
              className='w-full sm:w-auto'
            >
              Generar Nuevo Pago
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar Link de Pago</CardTitle>
        <CardDescription>
          Seleccione un cliente para generar un link de pago.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='clientId'
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
                            ? clients.find(client => client.id === field.value)
                                ?.nombres +
                              ' ' +
                              clients.find(client => client.id === field.value)
                                ?.apellidos
                            : 'Seleccionar cliente...'}
                          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-full p-0'>
                      <Command>
                        <CommandInput placeholder='Buscar cliente...' />
                        <CommandList>
                          <CommandEmpty>
                            No se encontraron clientes.
                          </CommandEmpty>
                          <CommandGroup>
                            {clients.map(client => (
                              <CommandItem
                                value={`${client.nombres} ${client.apellidos}`}
                                key={client.id}
                                onSelect={() => {
                                  form.setValue('clientId', client.id)
                                  setOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    client.id === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {client.nombres} {client.apellidos}
                                {client.dni && ` - ${client.dni}`}
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

            <FormField
              control={form.control}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto (PEN)</FormLabel>
                  <FormControl>
                    <Input type='number' placeholder='0.00' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='concept'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concepto</FormLabel>
                  <FormControl>
                    <Input placeholder='Ej: Cuota préstamo #123' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Generar Link de Pago
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
