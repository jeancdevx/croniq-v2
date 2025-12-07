'use client'

import { Download, Trash2 } from 'lucide-react'

import { Prestamo } from '@/modules/loans/domain/types'
import {
  eliminarTodosPrestamos,
  exportarPrestamosCSV
} from '@/modules/loans/services/storage'
import { formatearFechaHora } from '@/modules/loans/utils/loan-calculations'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

interface TablaPrestamosProps {
  prestamos: Prestamo[]
  onPrestamosActualizados: () => void
}

export function TablaPrestamos({
  prestamos,
  onPrestamosActualizados
}: TablaPrestamosProps) {
  const handleExportar = () => {
    exportarPrestamosCSV(prestamos)
  }

  const handleLimpiar = () => {
    if (prestamos.length === 0) {
      alert('No hay préstamos para limpiar.')
      return
    }

    if (
      confirm(
        '¿Estás seguro de que deseas eliminar todos los préstamos registrados?'
      )
    ) {
      eliminarTodosPrestamos()
      onPrestamosActualizados()
      alert('Historial limpiado exitosamente.')
    }
  }

  return (
    <Card className='border-border/40 bg-card/50'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>
          📊 Préstamos Registrados ({prestamos.length})
        </CardTitle>
        <CardAction>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleExportar}
              disabled={prestamos.length === 0}
              className='border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            >
              <Download className='mr-2 size-4' />
              Exportar
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleLimpiar}
              disabled={prestamos.length === 0}
              className='border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20'
            >
              <Trash2 className='mr-2 size-4' />
              Limpiar
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className='border-border/40 overflow-hidden rounded-lg border'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='border-border/40 bg-muted/50 hover:bg-muted/50'>
                  <TableHead className='font-semibold'>
                    Fecha Registro
                  </TableHead>
                  <TableHead className='font-semibold'>Nombre</TableHead>
                  <TableHead className='font-semibold'>DNI</TableHead>
                  <TableHead className='font-semibold'>PEP</TableHead>
                  <TableHead className='text-right font-semibold'>
                    Monto (S/.)
                  </TableHead>
                  <TableHead className='text-right font-semibold'>
                    Plazo
                  </TableHead>
                  <TableHead className='text-right font-semibold'>
                    Cuota Fija
                  </TableHead>
                  <TableHead className='text-right font-semibold'>
                    Mora (1%)
                  </TableHead>
                  <TableHead className='text-right font-semibold'>
                    Total a Pagar
                  </TableHead>
                  <TableHead className='text-right font-semibold'>
                    TCEA
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestamos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className='text-muted-foreground py-12 text-center'
                    >
                      <div className='flex flex-col items-center gap-2'>
                        <span className='text-4xl'>📋</span>
                        <p className='text-sm'>No hay préstamos registrados</p>
                        <p className='text-xs'>
                          Comienza registrando tu primer préstamo arriba
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  prestamos.map(prestamo => (
                    <TableRow
                      key={prestamo.id}
                      className='border-border/40 hover:bg-muted/30 transition-colors'
                    >
                      <TableCell className='font-medium'>
                        <span className='text-muted-foreground text-xs'>
                          {formatearFechaHora(prestamo.fechaRegistro)}
                        </span>
                      </TableCell>
                      <TableCell className='font-medium'>
                        {prestamo.cliente.nombreCompleto}
                      </TableCell>
                      <TableCell className='font-mono text-sm'>
                        {prestamo.cliente.dni}
                      </TableCell>
                      <TableCell>
                        {prestamo.cliente.esPep ? (
                          <span className='inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400'>
                            Sí
                          </span>
                        ) : (
                          <span className='text-muted-foreground text-xs'>
                            No
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='text-right font-semibold'>
                        <span className='text-emerald-400'>
                          S/. {prestamo.monto.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className='text-right'>
                        <span className='text-muted-foreground text-sm'>
                          {prestamo.plazo} meses
                        </span>
                      </TableCell>
                      <TableCell className='text-right font-medium'>
                        S/. {prestamo.cuotaMensual.toFixed(2)}
                      </TableCell>
                      <TableCell className='text-right'>
                        <span className='text-sm text-amber-400'>
                          S/. {prestamo.moraMensual.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className='text-right font-semibold'>
                        S/. {prestamo.totalPagar.toFixed(2)}
                      </TableCell>
                      <TableCell className='text-right'>
                        <span className='inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400'>
                          {prestamo.tcea.toFixed(2)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
