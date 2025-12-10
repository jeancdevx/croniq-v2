'use client'

import Link from 'next/link'

import { ArrowLeft, Calendar, DollarSign, User } from 'lucide-react'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import type { PrestamoConCuotas } from '@/db/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

interface LoanDetailActiveViewProps {
  loan: PrestamoConCuotas
}

export function LoanDetailActiveView({ loan }: LoanDetailActiveViewProps) {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: loan.monedaPrestamo || 'PEN'
    }).format(Number(amount))
  }

  const totalPaid = loan.cuotas.reduce(
    (acc, c) => acc + Number(c.montoPagado || 0),
    0
  )
  const totalAmount = Number(loan.totalAPagar)
  const totalInteres = loan.cuotas.reduce(
    (acc, c) => acc + Number(c.interes || 0),
    0
  )
  const progress =
    totalAmount > 0 ? Math.min((totalPaid / totalAmount) * 100, 100) : 0

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link href='/loans'>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Préstamo {loan.id.slice(0, 8)}
            </h1>
            <p className='text-muted-foreground'>
              Detalles y seguimiento del préstamo
            </p>
          </div>
        </div>
        <div className='flex gap-2'>
          <Link href={`/payment/schedule/${loan.id}/pdf`} target='_blank'>
            <Button variant='outline'>Cronograma PDF</Button>
          </Link>
          {/* Link to payments page, pre-filtered if possible, or just general */}
          <Link href='/payments'>
            <Button>Ir a Pagos</Button>
          </Link>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Cliente</CardTitle>
            <User className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {loan.cliente.nombres} {loan.cliente.apellidos}
            </div>
            <p className='text-muted-foreground text-xs'>
              DNI: {loan.cliente.dni}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Progreso de Pago
            </CardTitle>
            <DollarSign className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(totalPaid)}
              <span className='text-muted-foreground ml-1 text-sm font-normal'>
                / {formatCurrency(totalAmount)}
              </span>
            </div>
            <Progress value={progress} className='mt-2' />
            <p className='text-muted-foreground mt-2 text-xs'>
              {progress.toFixed(1)}% completado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Estado</CardTitle>
            <Calendar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='mb-2'>
              <Badge
                variant={loan.estado === 'ACTIVO' ? 'default' : 'secondary'}
              >
                {loan.estado}
              </Badge>
            </div>
            <p className='text-muted-foreground text-xs'>
              Frecuencia: {loan.frecuencia}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Tasas</CardTitle>
            <DollarSign className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='space-y-1'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>TEA:</span>
                <span className='font-medium'>{loan.tea}%</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>TCEA:</span>
                <span className='font-medium'>{loan.tcea}%</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Seguro:</span>
                <span className='font-medium'>
                  {loan.tasaSeguroDesgravamen}%
                </span>
              </div>
              <div className='mt-1 flex justify-between border-t pt-1 text-sm'>
                <span className='text-muted-foreground'>Total Interés:</span>
                <span className='font-medium'>
                  {formatCurrency(totalInteres)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Pagos</CardTitle>
          <CardDescription>Lista de cuotas y estados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[60px]'>#</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Capital</TableHead>
                <TableHead>Interés</TableHead>
                <TableHead>Seguro</TableHead>
                <TableHead>Total Cuota</TableHead>
                <TableHead>Pagado</TableHead>
                <TableHead>Pendiente</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loan.cuotas.map(cuota => (
                <TableRow key={cuota.id}>
                  <TableCell className='font-medium'>
                    {cuota.numeroCuota}
                  </TableCell>
                  <TableCell>
                    {format(new Date(cuota.fechaVencimiento), 'dd MMM yyyy', {
                      locale: es
                    })}
                  </TableCell>
                  <TableCell>{formatCurrency(cuota.capital)}</TableCell>
                  <TableCell>{formatCurrency(cuota.interes)}</TableCell>
                  <TableCell>
                    {formatCurrency(cuota.seguroDesgravamen)}
                  </TableCell>
                  <TableCell className='font-bold'>
                    {formatCurrency(cuota.totalConSeguro)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(cuota.montoPagado || 0)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(cuota.saldoPendiente || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        cuota.estado === 'PAGADO'
                          ? 'default'
                          : cuota.estado === 'PENDIENTE'
                            ? 'outline'
                            : 'destructive'
                      }
                      className={
                        cuota.estado === 'PAGADO'
                          ? 'border-green-200 bg-green-100 text-green-800 hover:bg-green-200'
                          : cuota.estado === 'PENDIENTE'
                            ? 'border-yellow-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'border-red-200 bg-red-100 text-red-800 hover:bg-red-200'
                      }
                    >
                      {cuota.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
