import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
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

import type { Movimiento } from '../types'

interface TablaMovimientosProps {
  movimientos: Movimiento[]
  compact?: boolean
}

export function TablaMovimientos({
  movimientos,
  compact = false
}: TablaMovimientosProps) {
  if (movimientos.length === 0) {
    if (compact) {
      return (
        <div className='text-muted-foreground py-4 text-center text-sm'>
          No hay movimientos registrados
        </div>
      )
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
          <CardDescription>No hay movimientos registrados aún</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const tableContent = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Hora</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead className='text-right'>Monto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movimientos.map(mov => {
          const fecha = new Date(mov.fechaMovimiento)
          const esIngreso = mov.tipo === 'INGRESO'

          return (
            <TableRow key={mov.id}>
              <TableCell className='font-medium'>
                {fecha.toLocaleTimeString('es-PE', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  {esIngreso ? (
                    <ArrowUpCircle className='h-4 w-4 text-emerald-400' />
                  ) : (
                    <ArrowDownCircle className='h-4 w-4 text-rose-400' />
                  )}
                  <span
                    className={esIngreso ? 'text-emerald-400' : 'text-rose-400'}
                  >
                    {mov.tipo}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant='outline'>{mov.categoria}</Badge>
              </TableCell>
              <TableCell className='max-w-xs truncate'>
                {mov.descripcion}
                {mov.categoria === 'PAGO_FLOW' && mov.comisionFlow && (
                  <span className='text-muted-foreground block text-xs'>
                    Bruto: S/ {Number(mov.montoBruto).toFixed(2)} | Com: S/{' '}
                    {Number(mov.comisionFlow).toFixed(2)}
                  </span>
                )}
              </TableCell>
              <TableCell
                className={`text-right font-bold ${
                  esIngreso ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {esIngreso ? '+' : '-'} S/ {Number(mov.monto).toFixed(2)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )

  if (compact) {
    return <div className='rounded-lg border'>{tableContent}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos del Día</CardTitle>
        <CardDescription>
          {movimientos.length} movimiento(s) registrado(s)
        </CardDescription>
      </CardHeader>
      <CardContent>{tableContent}</CardContent>
    </Card>
  )
}
