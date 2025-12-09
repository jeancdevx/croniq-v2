'use client'

import { useState } from 'react'

import {
  Copy,
  Download,
  ExternalLink,
  MoreHorizontal,
  QrCode,
  Search,
  Send,
  Trash
} from 'lucide-react'

import { cancelPayment, sendPaymentReceipt } from '@/proxy/payments/actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { QRCodeCanvas } from 'qrcode.react'
import { toast } from 'sonner'

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
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
  const [qrOpen, setQrOpen] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)

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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' className='h-8 w-8 p-0'>
                            <span className='sr-only'>Abrir menú</span>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(pago.id)
                              toast.success('ID de pago copiado')
                            }}
                          >
                            <Copy className='mr-2 h-4 w-4' />
                            Copiar ID Pago
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {pago.url ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => window.open(pago.url, '_blank')}
                              >
                                <ExternalLink className='mr-2 h-4 w-4' />
                                Ir al Link de Pago
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (pago.url) {
                                    navigator.clipboard.writeText(pago.url)
                                    toast.success(
                                      'Link copiado al portapapeles'
                                    )
                                  }
                                }}
                              >
                                <Copy className='mr-2 h-4 w-4' />
                                Copiar Link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (pago.url) {
                                    setSelectedUrl(pago.url)
                                    setQrOpen(true)
                                  }
                                }}
                              >
                                <QrCode className='mr-2 h-4 w-4' />
                                Ver QR
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem disabled>
                              <ExternalLink className='mr-2 h-4 w-4' />
                              Sin Link de Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              toast.promise(
                                sendPaymentReceipt(
                                  pago.id,
                                  pago.type || 'FLOW'
                                ),
                                {
                                  loading: 'Enviando comprobante...',
                                  success: data => {
                                    if (data.success)
                                      return 'Comprobante enviado'
                                    throw new Error(data.error)
                                  },
                                  error: (err: unknown) =>
                                    err instanceof Error
                                      ? err.message
                                      : 'Error al enviar'
                                }
                              )
                            }}
                          >
                            <Send className='mr-2 h-4 w-4' />
                            Enviar Comprobante
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={pago.estado !== 'Pendiente'}
                            onClick={async () => {
                              const result = await cancelPayment(pago.id)
                              if (result.success) {
                                toast.success('Pago cancelado correctamente')
                              } else {
                                toast.error(
                                  result.error || 'Error al cancelar el pago'
                                )
                              }
                            }}
                            className='text-red-600 focus:text-red-600'
                          >
                            <Trash className='mr-2 h-4 w-4' />
                            Cancelar Pago
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Código QR de Pago</DialogTitle>
          </DialogHeader>
          <div className='flex items-center justify-center p-6'>
            {selectedUrl && (
              <div className='rounded-lg bg-white p-4'>
                <QRCodeCanvas value={selectedUrl} size={256} level='H' />
              </div>
            )}
          </div>
          <div className='flex justify-center'>
            <Button
              variant='outline'
              onClick={() => {
                const canvas = document.querySelector('canvas')
                if (canvas) {
                  const pngUrl = canvas
                    .toDataURL('image/png')
                    .replace('image/png', 'image/octet-stream')
                  const downloadLink = document.createElement('a')
                  downloadLink.href = pngUrl
                  downloadLink.download = 'qr-pago.png'
                  document.body.appendChild(downloadLink)
                  downloadLink.click()
                  document.body.removeChild(downloadLink)
                }
              }}
            >
              <Download className='mr-2 h-4 w-4' />
              Descargar QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
