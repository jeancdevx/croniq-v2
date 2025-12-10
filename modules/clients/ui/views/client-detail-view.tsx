'use client'

import Link from 'next/link'

import { ArrowLeft, Mail, MapPin, Phone, User } from 'lucide-react'

import { format } from 'date-fns'

import { Cliente, PrestamoConCuotas } from '@/db/types'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

import { ClientActions } from '../components/client-actions'

interface ClientDetailViewProps {
  client: Cliente
  loans: PrestamoConCuotas[]
}

export function ClientDetailView({ client, loans }: ClientDetailViewProps) {
  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center gap-4'>
        <Link href='/clients'>
          <Button variant='outline' size='icon'>
            <ArrowLeft className='h-4 w-4' />
          </Button>
        </Link>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold tracking-tight'>
            Detalles del Cliente
          </h1>
          <p className='text-muted-foreground'>
            Información personal y e historial de préstamos
          </p>
        </div>
        <div className='flex gap-2'>
          <ClientActions client={client} />
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <Card className='md:col-span-2 lg:col-span-1'>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4'>
            <div className='flex items-center gap-4'>
              <div className='bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full'>
                <User className='text-primary h-8 w-8' />
              </div>
              <div>
                <p className='text-lg font-medium'>
                  {client.nombres} {client.apellidos}
                </p>
                <p className='text-muted-foreground text-sm'>
                  DNI: {client.dni}
                </p>
              </div>
            </div>
            <Separator />
            <div className='grid gap-2'>
              <div className='flex items-center gap-2'>
                <Phone className='text-muted-foreground h-4 w-4' />
                <span>{client.telefono}</span>
              </div>
              {client.email && (
                <div className='flex items-center gap-2'>
                  <Mail className='text-muted-foreground h-4 w-4' />
                  <span>{client.email}</span>
                </div>
              )}
              {client.direccion && (
                <div className='flex items-center gap-2'>
                  <MapPin className='text-muted-foreground h-4 w-4' />
                  <span>{client.direccion}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className='md:col-span-2'>
          <CardHeader>
            <CardTitle>Historial de Préstamos</CardTitle>
            <CardDescription>
              Lista de todos los préstamos asociados a este cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loans.length === 0 ? (
              <div className='text-muted-foreground py-8 text-center'>
                Este cliente no tiene préstamos registrados.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Cuotas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className='text-right'>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map(loan => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        {format(new Date(loan.fechaDesembolso), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('es-PE', {
                          style: 'currency',
                          currency: loan.monedaPrestamo
                        }).format(Number(loan.montoSolicitado))}
                      </TableCell>
                      <TableCell className='capitalize'>
                        {loan.frecuencia.toLowerCase()}
                      </TableCell>
                      <TableCell>{loan.numeroCuotas}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            loan.estado === 'ACTIVO'
                              ? 'default'
                              : loan.estado === 'FINALIZADO'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {loan.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <Link href={`/loans/${loan.id}`}>
                          <Button variant='ghost' size='sm'>
                            Ver
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
