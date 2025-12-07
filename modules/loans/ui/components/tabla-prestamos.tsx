'use client'

import { Download, Trash2 } from 'lucide-react'

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

import { Prestamo } from '../domain/types'
import {
  eliminarTodosPrestamos,
  exportarPrestamosCSV
} from '../services/storage'
import { formatearFechaHora } from '../utils/loan-calculations'

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
    <Card>
      <CardHeader>
        <CardTitle>Resultados del Registro (Tabla de Préstamos)</CardTitle>
        <CardAction>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleExportar}
              disabled={prestamos.length === 0}
            >
              <Download className='mr-2 size-4' />
              Exportar
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={handleLimpiar}
              disabled={prestamos.length === 0}
            >
              <Trash2 className='mr-2 size-4' />
              Limpiar
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className='overflow-hidden rounded-lg border'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>PEP</TableHead>
                  <TableHead className='text-right'>Monto (S/.)</TableHead>
                  <TableHead className='text-right'>Plazo (Meses)</TableHead>
                  <TableHead className='text-right'>Cuota Fija (S/.)</TableHead>
                  <TableHead className='text-right'>
                    Mora Mensual (1%)
                  </TableHead>
                  <TableHead className='text-right'>
                    Total a Pagar (S/.)
                  </TableHead>
                  <TableHead className='text-right'>TCEA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestamos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className='text-muted-foreground py-8 text-center'
                    >
                      No hay préstamos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  prestamos.map(prestamo => (
                    <TableRow key={prestamo.id}>
                      <TableCell className='font-medium'>
                        {formatearFechaHora(prestamo.fechaRegistro)}
                      </TableCell>
                      <TableCell>{prestamo.cliente.nombreCompleto}</TableCell>
                      <TableCell>{prestamo.cliente.dni}</TableCell>
                      <TableCell>
                        {prestamo.cliente.esPep ? 'Sí' : 'No'}
                      </TableCell>
                      <TableCell className='text-right'>
                        S/. {prestamo.monto.toFixed(2)}
                      </TableCell>
                      <TableCell className='text-right'>
                        {prestamo.plazo}
                      </TableCell>
                      <TableCell className='text-right'>
                        S/. {prestamo.cuotaMensual.toFixed(2)}
                      </TableCell>
                      <TableCell className='text-right'>
                        S/. {prestamo.moraMensual.toFixed(2)}
                      </TableCell>
                      <TableCell className='text-right'>
                        S/. {prestamo.totalPagar.toFixed(2)}
                      </TableCell>
                      <TableCell className='text-right'>
                        {prestamo.tcea.toFixed(2)}%
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
