'use client'

import { useState } from 'react'

import { Download, Search } from 'lucide-react'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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

export interface Receipt {
  id: string
  nroRecibo: string
  cliente: string
  fecha: Date
  monto: number
  estado: 'Emitido' | 'Anulado'
  urlPdf: string
}

interface ReceiptsListProps {
  receipts?: Receipt[]
}

const MOCK_RECEIPTS: Receipt[] = [
  // ... mocks ...
]

export function ReceiptsList({ receipts = [] }: ReceiptsListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Use mocks if no data provided, but for now let's default to empty or provided
  const displayReceipts = receipts.length > 0 ? receipts : MOCK_RECEIPTS

  const filteredReceipts = displayReceipts.filter(
    receipt =>
      receipt.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.nroRecibo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className='border-border/40 bg-card/50'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>
          Comprobantes de Pago
        </CardTitle>
        <CardDescription>
          Historial de recibos emitidos por el sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='mb-4 flex items-center gap-4'>
          <div className='relative flex-1'>
            <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
            <Input
              placeholder='Buscar por cliente o N° Recibo...'
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
                <TableHead>N° Recibo</TableHead>
                <TableHead>Fecha Emisión</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className='text-right'>Descarga</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center'>
                    No se encontraron comprobantes.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceipts.map(receipt => (
                  <TableRow key={receipt.id}>
                    <TableCell className='font-mono text-xs font-medium'>
                      {receipt.nroRecibo}
                    </TableCell>
                    <TableCell>
                      {format(receipt.fecha, 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>{receipt.cliente}</TableCell>
                    <TableCell className='font-semibold'>
                      S/ {receipt.monto.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={
                          receipt.estado === 'Emitido'
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                            : 'border-red-500/20 bg-red-500/10 text-red-500'
                        }
                      >
                        {receipt.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                        <Download className='h-4 w-4' />
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
