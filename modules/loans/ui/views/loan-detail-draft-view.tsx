'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

import type { PrestamoConCuotas } from '@/db/types'

import { activateLoan, deleteDraftLoan } from '@/modules/loans/server'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface LoanDetailDraftViewProps {
  loan: PrestamoConCuotas
}

export function LoanDetailDraftView({ loan }: LoanDetailDraftViewProps) {
  const router = useRouter()
  const [isActivating, setIsActivating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleActivate = async () => {
    setIsActivating(true)

    try {
      const result = await activateLoan(loan.id)

      if (result.success) {
        toast.success('¡Préstamo activado!', {
          description: 'El préstamo ahora está activo y listo para desembolso'
        })
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
      setIsActivating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteDraftLoan(loan.id)

      if (result.success) {
        toast.success('Borrador eliminado', {
          description: 'El préstamo ha sido eliminado correctamente'
        })
        router.push('/loans')
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
      setIsDeleting(false)
    }
  }

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency
    }).format(parseFloat(amount))
  }

  const formatPercent = (value: string) => {
    return `${(parseFloat(value) * 100).toFixed(2)}%`
  }

  // Helper para formatear fechas desde ISO string (YYYY-MM-DD)
  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es })
  }

  return (
    <div className='flex flex-col gap-6 p-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold'>Préstamo en Borrador</h1>
            <Badge variant='secondary'>DRAFT</Badge>
          </div>
          <p className='text-muted-foreground mt-1'>
            Revisa los detalles antes de confirmar
          </p>
        </div>

        <div className='flex gap-2'>
          <Link href='/loans'>
            <Button variant='outline'>Volver</Button>
          </Link>
          <Link href={`/loans/${loan.id}/edit`}>
            <Button variant='outline' disabled={isDeleting || isActivating}>
              Editar
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant='destructive'
                disabled={isDeleting || isActivating}
              >
                Eliminar Borrador
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar borrador?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El préstamo y todas sus
                  cuotas asociadas serán eliminados permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isActivating || isDeleting}>
                Confirmar Préstamo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar préstamo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción activará el préstamo. Una vez confirmado, no
                  podrás modificar los términos del préstamo. Asegúrate de que
                  todos los detalles sean correctos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleActivate}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Separator />

      {/* Información del Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div>
            <p className='text-muted-foreground text-sm'>Nombre</p>
            <p className='font-medium'>
              {loan.cliente
                ? `${loan.cliente.nombres} ${loan.cliente.apellidos}`
                : '-'}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>DNI</p>
            <p className='font-medium'>{loan.cliente?.dni || '-'}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Teléfono</p>
            <p className='font-medium'>{loan.cliente?.telefono || '-'}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Email</p>
            <p className='font-medium'>{loan.cliente?.email || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Detalles del Préstamo */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Préstamo</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-6 md:grid-cols-3'>
          <div>
            <p className='text-muted-foreground text-sm'>Monto Solicitado</p>
            <p className='text-2xl font-bold'>
              {formatCurrency(loan.montoSolicitado, loan.monedaPrestamo)}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Monto a Desembolsar</p>
            <p className='text-2xl font-bold'>
              {formatCurrency(loan.montoDesembolsado, loan.monedaPrestamo)}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Total a Pagar</p>
            <p className='text-2xl font-bold'>
              {formatCurrency(loan.totalAPagar, loan.monedaPago)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tasas y Comisiones */}
      <Card>
        <CardHeader>
          <CardTitle>Tasas y Condiciones</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-4'>
          <div>
            <p className='text-muted-foreground text-sm'>TEA</p>
            <p className='text-xl font-semibold'>{formatPercent(loan.tea)}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>TEM</p>
            <p className='text-xl font-semibold'>{formatPercent(loan.tem)}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>TCEA</p>
            <p className='text-xl font-semibold'>{formatPercent(loan.tcea)}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Comisión</p>
            <p className='text-xl font-semibold'>
              {formatCurrency(loan.comisionDesembolso, loan.monedaPrestamo)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-3'>
          <div>
            <p className='text-muted-foreground text-sm'>Plazo</p>
            <p className='font-medium'>{loan.numeroCuotas} meses</p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Fecha Desembolso</p>
            <p className='font-medium'>{formatDate(loan.fechaDesembolso)}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Primer Vencimiento</p>
            <p className='font-medium'>
              {formatDate(loan.fechaPrimerVencimiento)}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Día de Pago</p>
            <p className='font-medium'>Día {loan.diaVencimiento}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Moneda Préstamo</p>
            <p className='font-medium'>{loan.monedaPrestamo}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Moneda Pago</p>
            <p className='font-medium'>{loan.monedaPago}</p>
          </div>
          {loan.tipoCambioDesembolso && (
            <div>
              <p className='text-muted-foreground text-sm'>Tipo de Cambio</p>
              <p className='font-medium'>
                S/ {parseFloat(loan.tipoCambioDesembolso).toFixed(4)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cronograma de Cuotas */}
      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Pagos</CardTitle>
          <CardDescription>
            {loan.cuotas?.length || 0} cuotas programadas en{' '}
            {loan.monedaPrestamo}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b-2'>
                  <th className='pb-3 text-left'>#</th>
                  <th className='pb-3 text-left'>Fecha</th>
                  <th className='pb-3 text-right'>Saldo Inicial</th>
                  <th className='pb-3 text-right'>Capital</th>
                  <th className='pb-3 text-right'>Interés</th>
                  <th className='pb-3 text-right'>Seguro</th>
                  <th className='pb-3 text-right'>Cuota Total</th>
                  <th className='pb-3 text-right'>Saldo Final</th>
                </tr>
              </thead>
              <tbody>
                {loan.cuotas?.map((cuota, index) => {
                  // Calcular saldo inicial
                  const saldoInicial =
                    index === 0
                      ? loan.montoSolicitado
                      : loan.cuotas?.[index - 1]?.saldoRestante || '0'

                  const formatNumber = (value: string) => {
                    return new Intl.NumberFormat('es-PE', {
                      style: 'currency',
                      currency: loan.monedaPrestamo,
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(parseFloat(value))
                  }

                  return (
                    <tr key={cuota.id} className='border-b'>
                      <td className='py-2.5'>{cuota.numeroCuota}</td>
                      <td className='py-2.5'>
                        {formatDate(cuota.fechaVencimiento)}
                      </td>
                      <td className='py-2.5 text-right tabular-nums'>
                        {formatNumber(saldoInicial)}
                      </td>
                      <td className='py-2.5 text-right tabular-nums'>
                        {formatNumber(cuota.capital)}
                      </td>
                      <td className='py-2.5 text-right tabular-nums'>
                        {formatNumber(cuota.interes)}
                      </td>
                      <td className='py-2.5 text-right tabular-nums'>
                        {formatNumber(cuota.seguroDesgravamen)}
                      </td>
                      <td className='py-2.5 text-right font-semibold tabular-nums'>
                        {formatNumber(cuota.totalConSeguro)}
                      </td>
                      <td className='py-2.5 text-right tabular-nums'>
                        {formatNumber(cuota.saldoRestante)}
                      </td>
                    </tr>
                  )
                })}

                {/* Fila de Totales */}
                <tr className='bg-muted/30 border-t-2 font-semibold'>
                  <td className='py-3' colSpan={3}>
                    TOTAL
                  </td>
                  <td className='py-3 text-right tabular-nums'>
                    {new Intl.NumberFormat('es-PE', {
                      style: 'currency',
                      currency: loan.monedaPrestamo,
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(
                      loan.cuotas?.reduce(
                        (sum, c) => sum + parseFloat(c.capital),
                        0
                      ) || 0
                    )}
                  </td>
                  <td className='py-3 text-right tabular-nums'>
                    {new Intl.NumberFormat('es-PE', {
                      style: 'currency',
                      currency: loan.monedaPrestamo,
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(
                      loan.cuotas?.reduce(
                        (sum, c) => sum + parseFloat(c.interes),
                        0
                      ) || 0
                    )}
                  </td>
                  <td className='py-3 text-right tabular-nums'>
                    {new Intl.NumberFormat('es-PE', {
                      style: 'currency',
                      currency: loan.monedaPrestamo,
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(
                      loan.cuotas?.reduce(
                        (sum, c) => sum + parseFloat(c.seguroDesgravamen),
                        0
                      ) || 0
                    )}
                  </td>
                  <td className='py-3 text-right tabular-nums'>
                    {new Intl.NumberFormat('es-PE', {
                      style: 'currency',
                      currency: loan.monedaPrestamo,
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(
                      loan.cuotas?.reduce(
                        (sum, c) => sum + parseFloat(c.totalConSeguro),
                        0
                      ) || 0
                    )}
                  </td>
                  <td className='py-3'></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
