'use client'

import { Download } from 'lucide-react'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { PrestamoConCuotas } from '@/db/types'

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
  prestamos: PrestamoConCuotas[]
}

export function TablaPrestamos({ prestamos }: TablaPrestamosProps) {
  const handleExportar = () => {
    // TODO: Implement export functionality for DB loans
    alert('Funcionalidad de exportación en desarrollo')
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
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className='border-border/40 overflow-hidden rounded-lg border'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='border-border/40 bg-muted/50 hover:bg-muted/50'>
                  <TableHead className='font-semibold'>Fecha</TableHead>
                  <TableHead className='font-semibold'>Cliente</TableHead>
                  <TableHead className='font-semibold'>DNI</TableHead>
                  <TableHead className='text-right font-semibold'>
                    Monto
                  </TableHead>
                  <TableHead className='text-right font-semibold'>
                    Plazo
                  </TableHead>
                  <TableHead className='text-right font-semibold'>
                    Tasa
                  </TableHead>
                  <TableHead className='text-right font-semibold'>
                    Estado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestamos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
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
                          {format(
                            prestamo.createdAt || new Date(),
                            'dd/MM/yyyy HH:mm',
                            { locale: es }
                          )}
                        </span>
                      </TableCell>
                      <TableCell className='font-medium'>
                        {prestamo.cliente.nombres} {prestamo.cliente.apellidos}
                      </TableCell>
                      <TableCell className='font-mono text-sm'>
                        {prestamo.cliente.dni}
                      </TableCell>
                      <TableCell className='text-right font-semibold'>
                        <span className='text-emerald-400'>
                          S/. {parseFloat(prestamo.montoSolicitado).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className='text-right'>
                        <span className='text-muted-foreground text-sm'>
                          {prestamo.numeroCuotas} meses
                        </span>
                      </TableCell>
                      <TableCell className='text-right font-medium'>
                        {parseFloat(prestamo.tasaInteres).toFixed(2)}%
                      </TableCell>
                      <TableCell className='text-right'>
                        <span className='inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400'>
                          {prestamo.estado}
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
