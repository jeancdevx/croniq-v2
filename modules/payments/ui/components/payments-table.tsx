'use client'

import { useState } from 'react'

import { Download, ExternalLink, FileText, Search } from 'lucide-react'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Pago } from '@/modules/payments/domain/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

interface PaymentsTableProps {
  pagos?: Pago[]
}

// Mock Data if no props provided
const MOCK_PAGOS: Pago[] = [
  {
    id: '1',
    clienteNombre: 'Juan Pérez',
    clienteDni: '12345678',
    fechaPago: new Date(),
    monto: 150.0,
    medioPago: 'Flow',
    codigoOperacion: 'FLOW-12345',
    estado: 'Completado'
  },
  {
    id: '2',
    clienteNombre: 'Maria Lopez',
    clienteDni: '87654321',
    fechaPago: new Date(Date.now() - 86400000),
    monto: 300.5,
    medioPago: 'Efectivo',
    estado: 'Completado'
  },
  {
    id: '3',
    clienteNombre: 'Carlos Ruiz',
    clienteDni: '11223344',
    fechaPago: new Date(Date.now() - 172800000),
    monto: 500.0,
    medioPago: 'Transferencia',
    codigoOperacion: 'OP-998877',
    estado: 'Pendiente'
  }
]

export function PaymentsTable({ pagos = MOCK_PAGOS }: PaymentsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPagos = pagos.filter(
    pago =>
      pago.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pago.clienteDni.includes(searchTerm)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado':
        return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20'
      case 'Pendiente':
        return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20'
      case 'Fallido':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  return (
    <Card className='border-border/40 bg-card/50'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-lg font-semibold'>
              Listado de Pagos
            </CardTitle>
            <CardDescription>
              Gestiona y visualiza el historial de transacciones.
            </CardDescription>
          </div>
          <Button variant='outline' size='sm'>
            <Download className='mr-2 h-4 w-4' />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='mb-4 flex items-center gap-4'>
          <div className='relative flex-1'>
            <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
            <Input
              placeholder='Buscar por cliente o DNI...'
              className='pl-9'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className='border-border/40 overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow className='border-border/40 bg-muted/50 hover:bg-muted/50'>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Operación</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className='text-right'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPagos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='h-24 text-center'>
                    No se encontraron pagos.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPagos.map(pago => (
                  <TableRow key={pago.id}>
                    <TableCell>
                      {format(pago.fechaPago, 'dd MMM yyyy', { locale: es })}
                      <br />
                      <span className='text-muted-foreground text-xs'>
                        {format(pago.fechaPago, 'HH:mm', { locale: es })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className='font-medium'>{pago.clienteNombre}</div>
                      <div className='text-muted-foreground text-xs'>
                        {pago.clienteDni}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>{pago.medioPago}</Badge>
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {pago.codigoOperacion || '-'}
                    </TableCell>
                    <TableCell className='font-semibold'>
                      S/ {pago.monto.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={getStatusColor(pago.estado)}
                      >
                        {pago.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      {pago.url && (
                        <Button
                          variant='ghost'
                          size='icon'
                          title='Ir al Link de Pago'
                          onClick={() => window.open(pago.url, '_blank')}
                        >
                          <ExternalLink className='h-4 w-4' />
                        </Button>
                      )}
                      <Button
                        variant='ghost'
                        size='icon'
                        title='Ver Comprobante'
                      >
                        <FileText className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
