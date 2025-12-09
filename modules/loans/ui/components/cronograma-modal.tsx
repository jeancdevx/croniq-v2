'use client'

import { Download, Send } from 'lucide-react'

import { CuotaPrestamo, Prestamo } from '@/modules/loans/domain/types'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

interface CronogramaModalProps {
  prestamo: Prestamo | null
  open: boolean
  onClose: () => void
}

export function CronogramaModal({
  prestamo,
  open,
  onClose
}: CronogramaModalProps) {
  if (!prestamo) return null

  const handleDescargarPDF = () => {
    // Generar contenido del cronograma
    let contenido = `CRONOGRAMA DE PAGOS\n\n`
    contenido += `Cliente: ${prestamo.cliente.nombreCompleto}\n`
    contenido += `DNI: ${prestamo.cliente.dni}\n`
    contenido += `Monto: S/. ${prestamo.monto.toFixed(2)}\n`
    contenido += `Plazo: ${prestamo.plazo} meses\n`
    contenido += `Cuota Mensual: S/. ${prestamo.cuotaMensual.toFixed(2)}\n`
    contenido += `TCEA: ${prestamo.tcea.toFixed(2)}%\n\n`
    contenido += `DETALLE DE CUOTAS:\n\n`

    prestamo.cronogramaPagos.forEach((cuota: CuotaPrestamo) => {
      contenido += `Cuota ${cuota.numeroCuota} - Vencimiento: ${cuota.fechaVencimiento} - Monto: S/. ${cuota.montoCuota.toFixed(2)}\n`
    })

    // Crear blob y descargar
    const blob = new Blob([contenido], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cronograma_${prestamo.cliente.dni}_${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleEnviarWhatsApp = () => {
    // Formatear mensaje para WhatsApp
    let mensaje = `*CRONOGRAMA DE PAGOS*%0A%0A`
    mensaje += `*Cliente:* ${prestamo.cliente.nombreCompleto}%0A`
    mensaje += `*DNI:* ${prestamo.cliente.dni}%0A`
    mensaje += `*Monto:* S/. ${prestamo.monto.toFixed(2)}%0A`
    mensaje += `*Plazo:* ${prestamo.plazo} meses%0A`
    mensaje += `*Cuota Mensual:* S/. ${prestamo.cuotaMensual.toFixed(2)}%0A`
    mensaje += `*TCEA:* ${prestamo.tcea.toFixed(2)}%%0A%0A`
    mensaje += `*DETALLE DE CUOTAS:*%0A%0A`

    prestamo.cronogramaPagos.forEach((cuota: CuotaPrestamo) => {
      mensaje += `📅 Cuota ${cuota.numeroCuota}%0A`
      mensaje += `Vencimiento: ${cuota.fechaVencimiento}%0A`
      mensaje += `Monto: S/. ${cuota.montoCuota.toFixed(2)}%0A%0A`
    })

    // Abrir WhatsApp (necesitarás el número del cliente)
    const url = `https://wa.me/?text=${mensaje}`
    window.open(url, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>📋 Cronograma de Pagos</DialogTitle>
          <DialogDescription>
            Cronograma generado para {prestamo.cliente.nombreCompleto}
          </DialogDescription>
        </DialogHeader>

        {/* Información del Préstamo */}
        <div className='space-y-4'>
          <div className='border-border/40 bg-muted/20 grid grid-cols-2 gap-4 rounded-lg border p-4 md:grid-cols-3'>
            <div>
              <p className='text-muted-foreground text-xs'>Cliente</p>
              <p className='font-medium'>{prestamo.cliente.nombreCompleto}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>DNI</p>
              <p className='font-mono text-sm'>{prestamo.cliente.dni}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>Monto</p>
              <p className='font-semibold text-emerald-400'>
                S/. {prestamo.monto.toFixed(2)}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>Plazo</p>
              <p className='font-medium'>{prestamo.plazo} meses</p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>Cuota Mensual</p>
              <p className='font-semibold'>
                S/. {prestamo.cuotaMensual.toFixed(2)}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs'>TCEA</p>
              <p className='font-medium text-blue-400'>
                {prestamo.tcea.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Tabla de Cronograma */}
          <div className='border-border/40 overflow-hidden rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow className='border-border/40 bg-muted/50'>
                  <TableHead className='font-semibold'>Cuota</TableHead>
                  <TableHead className='font-semibold'>
                    Fecha Vencimiento
                  </TableHead>
                  <TableHead className='text-right font-semibold'>
                    Monto
                  </TableHead>
                  <TableHead className='text-right font-semibold'>
                    Estado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestamo.cronogramaPagos.map((cuota: CuotaPrestamo) => (
                  <TableRow
                    key={cuota.numeroCuota}
                    className='border-border/40'
                  >
                    <TableCell className='font-medium'>
                      Cuota {cuota.numeroCuota}
                    </TableCell>
                    <TableCell className='font-mono text-sm'>
                      {cuota.fechaVencimiento}
                    </TableCell>
                    <TableCell className='text-right font-semibold'>
                      S/. {cuota.montoCuota.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-right'>
                      <span className='inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400'>
                        {cuota.estado}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Botones de Acción */}
          <div className='flex flex-col gap-2 sm:flex-row'>
            <Button
              onClick={handleDescargarPDF}
              className='flex-1 bg-emerald-600 hover:bg-emerald-700'
            >
              <Download className='mr-2 h-4 w-4' />
              Descargar Cronograma
            </Button>
            <Button
              onClick={handleEnviarWhatsApp}
              variant='outline'
              className='flex-1 border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20'
            >
              <Send className='mr-2 h-4 w-4' />
              Enviar por WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
