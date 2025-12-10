'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  Banknote,
  Check,
  ChevronsUpDown,
  CreditCard,
  Loader2,
  Send
} from 'lucide-react'

import {
  generatePaymentLink,
  getInstallmentsByLoanId,
  getLoansByClientId,
  registerCashPayment,
  resendPaymentLink
} from '@/proxy/payments/actions'
import { zodResolver } from '@hookform/resolvers/zod'
import { QRCodeCanvas } from 'qrcode.react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { Cliente, Cuota, Prestamo } from '@/db/types'
import { cn } from '@/lib/utils'

import { getSesionActual } from '@/modules/caja/server'

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
  FormDescription,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const formSchema = z.object({
  clientId: z.string().min(1, {
    message: 'Por favor seleccione un cliente.'
  }),
  loanId: z.string().min(1, {
    message: 'Por favor seleccione un préstamo.'
  }),
  baseAmount: z.coerce.number().min(0.1, {
    message: 'El monto debe ser mayor a 0.'
  }),
  paymentMethod: z
    .enum(['TARJETA', 'YAPE', 'PAGOEFECTIVO'], {
      message: 'Seleccione un medio de pago'
    })
    .optional(),
  concept: z.string().min(3, {
    message: 'El concepto debe tener al menos 3 caracteres.'
  })
})

interface PaymentsFormProps {
  clients?: Cliente[]
}

const COMMISSIONS = {
  FLOW: { fixed: 0 }, // Sin comisión - asumida por la empresa
  EFECTIVO: { fixed: 0 }
}

export function PaymentsForm({ clients = [] }: PaymentsFormProps) {
  const [paymentType, setPaymentType] = useState<'EFECTIVO' | 'FLOW'>(
    'EFECTIVO'
  )
  const [paymentMode, setPaymentMode] = useState<'INSTALLMENT' | 'CUSTOM'>(
    'INSTALLMENT'
  )
  const [cashReceived, setCashReceived] = useState<string>('')

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLoans, setIsLoadingLoans] = useState(false)
  const [loans, setLoans] = useState<Prestamo[]>([])
  const [installments, setInstallments] = useState<Cuota[]>([])
  const [open, setOpen] = useState(false)
  const [isSessionOpen, setIsSessionOpen] = useState<boolean | null>(null)
  const [generatedLink, setGeneratedLink] = useState<{
    url: string
    clientId: string
    concept: string
    amount: number
  } | null>(null)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: '',
      loanId: '',
      baseAmount: 0,
      concept: '',
      paymentMethod: 'TARJETA' as const
    }
  })

  // Check session status on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const result = await getSesionActual()
        setIsSessionOpen(!!result.sesionAbierta)
      } catch (error) {
        console.error('Error checking session:', error)
        setIsSessionOpen(false)
      }
    }
    checkSession()
  }, [])

  // Watchers
  const selectedClientId = form.watch('clientId')
  const selectedLoanId = form.watch('loanId')
  const baseAmount = form.watch('baseAmount')

  // Calculate totals
  const calculateTotal = (amount: number, type: 'EFECTIVO' | 'FLOW') => {
    const numAmount = Number(amount)
    if (!numAmount) return { total: 0, commission: 0 }
    const { fixed } = COMMISSIONS[type]
    const total = numAmount + fixed
    const commission = fixed
    return { total, commission }
  }

  const { total: totalAmount, commission: totalCommission } = calculateTotal(
    Number(baseAmount),
    paymentType
  )

  // Cash Calculations
  const cashReceivedAmount = parseFloat(cashReceived) || 0
  const changeAmount = cashReceivedAmount - totalAmount
  const canProcessCash =
    paymentType === 'EFECTIVO' && cashReceivedAmount >= totalAmount

  // Fetch loans when client changes
  useEffect(() => {
    // Reset previous loan data immediately when client changes
    form.setValue('loanId', '')
    form.setValue('baseAmount', 0)
    form.setValue('concept', '')
    setInstallments([])
    setLoans([])
    setPaymentMode('INSTALLMENT')
    setCashReceived('')

    const fetchLoans = async () => {
      if (!selectedClientId) {
        return
      }

      setIsLoadingLoans(true)
      try {
        const fetchedLoans = await getLoansByClientId(selectedClientId)
        setLoans(fetchedLoans)
      } catch (error) {
        console.error('Error fetching loans:', error)
        toast.error('Error al cargar los préstamos del cliente')
      } finally {
        setIsLoadingLoans(false)
      }
    }

    fetchLoans()
  }, [selectedClientId, form])

  // Fetch installments when loan changes
  useEffect(() => {
    const fetchInstallments = async () => {
      if (!selectedLoanId) {
        setInstallments([])
        return
      }

      // setIsLoadingInstallments(true)
      try {
        const fetchedInstallments =
          await getInstallmentsByLoanId(selectedLoanId)
        setInstallments(fetchedInstallments)
      } catch (error) {
        console.error('Error fetching installments:', error)
        toast.error('Error al cargar las cuotas')
      } finally {
        // setIsLoadingInstallments(false)
      }
    }

    fetchInstallments()
  }, [selectedLoanId])

  // Auto-select loan if only one active exists
  useEffect(() => {
    if (loans.length === 1) {
      form.setValue('loanId', loans[0].id)
    }
  }, [loans, form])

  const pendingInstallments = installments.filter(i => i.estado !== 'PAGADO')
  const totalDebt = pendingInstallments.reduce(
    (sum, i) => sum + Number(i.saldoPendiente ?? i.totalConSeguro),
    0
  )

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.baseAmount > totalDebt + 0.05) {
      toast.error(
        `El monto no puede exceder la deuda total de S/ ${totalDebt.toFixed(2)}`
      )
      return
    }

    const selectedClient = clients.find(client => client.id === values.clientId)

    if (!selectedClient) {
      toast.error('Cliente no encontrado')
      return
    }

    setIsLoading(true)

    try {
      if (paymentType === 'FLOW') {
        if (!selectedClient.email) {
          toast.error('El cliente seleccionado no tiene un email registrado')
          setIsLoading(false)
          return
        }

        const { total } = calculateTotal(values.baseAmount, 'FLOW')

        const result = await generatePaymentLink({
          email: selectedClient.email,
          amount: Number(total.toFixed(2)), // Monto total con comisión
          baseAmount: values.baseAmount, // Monto base a descontar
          concept: values.concept,
          clientId: selectedClient.id,
          loanId: values.loanId
        })

        if (result.success && result.url) {
          toast.success('Link de pago generado exitosamente')
          setGeneratedLink({
            url: result.url,
            clientId: selectedClient.id,
            concept: values.concept,
            amount: Number(total.toFixed(2))
          })
        } else {
          toast.error(result.error || 'Error al generar el link de pago')
        }
      } else {
        // Handle CASH Payment
        if (!canProcessCash) {
          toast.error('El monto recibido es insuficiente')
          setIsLoading(false)
          return
        }

        const result = await registerCashPayment({
          loanId: values.loanId,
          amount: values.baseAmount,
          concept: values.concept
        })

        if (result.success) {
          toast.success(
            `Pago en efectivo registrado. ${result.processedCount} cuotas afectadas.`
          )
          // Reset form
          form.reset({
            clientId: values.clientId, // Keep client
            loanId: values.loanId, // Keep loan
            baseAmount: 0,
            concept: '',
            paymentMethod: 'TARJETA'
          })
          setCashReceived('')

          // Refresh installments
          const fetchedInstallments = await getInstallmentsByLoanId(
            values.loanId
          )
          setInstallments(fetchedInstallments)
        } else {
          toast.error(result.error || 'Error al registrar pago')
        }
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

  const handleSelectInstallment = useCallback(
    (installment: Cuota) => {
      const pendingAmount = Number(
        installment.saldoPendiente ?? installment.totalConSeguro
      )
      form.setValue('baseAmount', pendingAmount)
      form.setValue(
        'concept',
        `Pago Cuota #${installment.numeroCuota} - Vence ${new Date(
          installment.fechaVencimiento
        ).toLocaleDateString()}`
      )
    },
    [form]
  )

  // Auto-select next installment
  useEffect(() => {
    if (installments.length > 0 && paymentMode === 'INSTALLMENT') {
      const nextInstallment = installments.find(i => i.estado !== 'PAGADO')
      if (nextInstallment) {
        handleSelectInstallment(nextInstallment)
      }
    }
  }, [installments, paymentMode, handleSelectInstallment])

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
                setInstallments([])
                setLoans([])
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
    <div className='flex flex-col gap-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Registrar Pago</h2>
        <p className='text-muted-foreground'>
          Complete el formulario para registrar un nuevo pago
        </p>
      </div>

      <div className='bg-card rounded-lg border p-6'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Seccion 1: Información del Pago */}
            <Card className='shadow-sm'>
              <CardHeader>
                <CardTitle>Información del Pago</CardTitle>
                <CardDescription>
                  Seleccione el cliente y el préstamo asociado
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-6 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='clientId'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Cliente *</FormLabel>
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
                                ? clients.find(
                                    client => client.id === field.value
                                  )?.nombres +
                                  ' ' +
                                  clients.find(
                                    client => client.id === field.value
                                  )?.apellidos
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

                {selectedClientId && loans.length > 1 && (
                  <FormField
                    control={form.control}
                    name='loanId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Préstamo *</FormLabel>
                        <Select
                          onValueChange={value => {
                            field.onChange(value)
                            setInstallments([])
                          }}
                          defaultValue={field.value}
                          disabled={isLoadingLoans}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  isLoadingLoans
                                    ? 'Cargando préstamos...'
                                    : 'Seleccionar préstamo'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loans.length === 0 ? (
                              <SelectItem value='none' disabled>
                                No hay préstamos activos
                              </SelectItem>
                            ) : (
                              loans.map(loan => (
                                <SelectItem key={loan.id} value={loan.id}>
                                  Préstamo del{' '}
                                  {new Date(
                                    loan.createdAt
                                  ).toLocaleDateString()}{' '}
                                  - S/ {Number(loan.montoSolicitado).toFixed(2)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {selectedClientId && loans.length === 1 && (
                  <div className='flex flex-col gap-2'>
                    <Label>Préstamo Activo</Label>
                    <div className='rounded-md border p-3 text-sm'>
                      Préstamo del{' '}
                      {new Date(loans[0].createdAt).toLocaleDateString()} - S/{' '}
                      {Number(loans[0].montoSolicitado).toFixed(2)}
                    </div>
                  </div>
                )}

                {selectedClientId && loans.length === 0 && !isLoadingLoans && (
                  <div className='flex flex-col gap-2'>
                    <Label className='text-muted-foreground'>
                      Estado del Préstamo
                    </Label>
                    <div className='bg-muted/50 text-muted-foreground rounded-md border border-dashed p-3 text-sm'>
                      El cliente seleccionado no tiene préstamos activos.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seccion 2: Detalles del Monto */}
            <Card className='shadow-sm'>
              <CardHeader>
                <CardTitle>Detalles del Monto</CardTitle>
                <CardDescription>
                  Configure el monto y concepto del pago
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-3'>
                  <Label>Modo de Pago</Label>
                  <RadioGroup
                    value={paymentMode}
                    onValueChange={v => {
                      setPaymentMode(v as 'INSTALLMENT' | 'CUSTOM')
                      form.setValue('baseAmount', 0)
                      form.setValue('concept', '')
                    }}
                    className='grid grid-cols-2 gap-4'
                  >
                    <div>
                      <RadioGroupItem
                        value='INSTALLMENT'
                        id='mode-installment'
                        className='peer sr-only'
                      />
                      <Label
                        htmlFor='mode-installment'
                        className='border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-between rounded-md border-2 p-4'
                      >
                        <span className='text-sm font-semibold'>
                          Pagar Cuota
                        </span>
                        <span className='text-muted-foreground mt-1 text-xs'>
                          Seleccionar una cuota específica
                        </span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value='CUSTOM'
                        id='mode-custom'
                        className='peer sr-only'
                      />
                      <Label
                        htmlFor='mode-custom'
                        className='border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-between rounded-md border-2 p-4'
                      >
                        <span className='text-sm font-semibold'>
                          Monto Personalizado
                        </span>
                        <span className='text-muted-foreground mt-1 text-xs'>
                          Ingresar cualquier cantidad
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {paymentMode === 'INSTALLMENT' &&
                  pendingInstallments.length > 0 && (
                    <div className='space-y-2'>
                      <Label>Cuota a Pagar (Siguiente Cuota Pendiente)</Label>
                      <div className='bg-muted rounded-md border p-3 text-sm font-medium'>
                        Cuota #{pendingInstallments[0].numeroCuota} - Vence{' '}
                        {new Date(
                          pendingInstallments[0].fechaVencimiento
                        ).toLocaleDateString()}{' '}
                        - S/{' '}
                        {Number(
                          pendingInstallments[0].saldoPendiente ??
                            pendingInstallments[0].totalConSeguro
                        ).toFixed(2)}
                      </div>
                    </div>
                  )}

                <FormField
                  control={form.control}
                  name='baseAmount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto a Amortizar (PEN) *</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='0.00'
                          {...field}
                          value={(field.value as number) || ''}
                          className='text-lg font-bold'
                          readOnly={paymentMode === 'INSTALLMENT'}
                        />
                      </FormControl>
                      <FormDescription>
                        {paymentMode === 'INSTALLMENT'
                          ? 'Monto automático basado en la cuota seleccionada'
                          : `Ingrese el monto a pagar (Máx: S/ ${totalDebt.toFixed(
                              2
                            )})`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='concept'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Concepto *</FormLabel>
                      <FormControl>
                        <Input placeholder='Ej: Cuota préstamo...' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Seccion 3: Método de Pago */}
            <Card className='shadow-sm'>
              <CardHeader>
                <CardTitle>Método de Pago</CardTitle>
                <CardDescription>Seleccione la forma de pago</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={paymentType}
                  onValueChange={v => setPaymentType(v as 'EFECTIVO' | 'FLOW')}
                  className='w-full'
                >
                  <TabsList className='grid h-12 w-full grid-cols-2'>
                    <TabsTrigger
                      value='EFECTIVO'
                      className='h-10 gap-2 text-base'
                    >
                      <Banknote className='h-4 w-4' /> Efectivo
                    </TabsTrigger>
                    <TabsTrigger value='FLOW' className='h-10 gap-2 text-base'>
                      <CreditCard className='h-4 w-4' /> Flow (Link de Pago)
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value='EFECTIVO' className='space-y-4 pt-4'>
                    {isSessionOpen === false && (
                      <div className='bg-destructive/10 text-destructive flex flex-col gap-2 rounded-lg border border-red-200 p-4 text-sm'>
                        <div className='flex items-center gap-2 font-bold'>
                          <span className='h-2 w-2 rounded-full bg-red-500' />
                          Caja Cerrada
                        </div>
                        <p>
                          No se pueden registrar pagos en efectivo porque la
                          caja está cerrada. Por favor, abra una nueva sesión de
                          caja.
                        </p>
                      </div>
                    )}

                    <div
                      className={cn(
                        'bg-muted/50 space-y-4 rounded-lg border p-4',
                        isSessionOpen === false &&
                          'pointer-events-none opacity-50'
                      )}
                    >
                      <div className='space-y-2'>
                        <label className='text-sm font-medium'>
                          Monto Recibido (Efectivo)
                        </label>
                        <div className='relative'>
                          <span className='text-muted-foreground absolute top-2.5 left-3 text-lg font-bold'>
                            S/
                          </span>
                          <Input
                            type='number'
                            className='h-12 pl-10 text-xl font-bold'
                            placeholder='0.00'
                            value={cashReceived}
                            onChange={e => setCashReceived(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-4 border-t pt-2'>
                        <div>
                          <p className='text-muted-foreground text-sm'>
                            Total a Cobrar
                          </p>
                          <p className='text-foreground text-2xl font-bold'>
                            S/ {totalAmount.toFixed(2)}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-muted-foreground text-sm'>
                            Vuelto a Entregar
                          </p>
                          <p
                            className={cn(
                              'text-2xl font-bold',
                              changeAmount < 0
                                ? 'text-destructive'
                                : 'text-emerald-600 dark:text-emerald-400'
                            )}
                          >
                            S/{' '}
                            {changeAmount >= 0
                              ? changeAmount.toFixed(2)
                              : '0.00'}
                          </p>
                        </div>
                      </div>

                      {changeAmount < 0 && cashReceivedAmount > 0 && (
                        <p className='text-destructive text-center text-xs font-medium'>
                          Falta S/ {Math.abs(changeAmount).toFixed(2)} para
                          cubrir el monto.
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value='FLOW' className='space-y-4 pt-4'>
                    <div className='space-y-2'>
                      <label className='text-sm leading-none font-medium'>
                        Resumen del Cobro
                      </label>
                      <div className='bg-muted/50 rounded-md border p-3 text-sm'>
                        <div className='flex justify-between'>
                          <span>Amortización:</span>
                          <span>S/ {Number(baseAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className='text-muted-foreground flex justify-between'>
                          <span>Comisión Flow:</span>
                          <span>S/ {totalCommission.toFixed(2)}</span>
                        </div>
                        <div className='mt-2 flex justify-between border-t pt-2 font-bold'>
                          <span>Total a Pagar:</span>
                          <span>S/ {totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className='flex justify-end gap-4'>
              <Button
                type='submit'
                className={cn(
                  'h-10 px-6',
                  paymentType === 'EFECTIVO'
                    ? 'bg-green-600 hover:bg-green-700'
                    : ''
                )}
                disabled={
                  isLoading ||
                  isLoadingLoans ||
                  loans.length === 0 ||
                  (paymentType === 'EFECTIVO' && !canProcessCash) ||
                  (paymentType === 'EFECTIVO' && isSessionOpen === false)
                }
              >
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {paymentType === 'EFECTIVO'
                  ? `Registrar Pago (S/ ${totalAmount.toFixed(2)})`
                  : `Generar Link de Pago (S/ ${totalAmount.toFixed(2)})`}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
