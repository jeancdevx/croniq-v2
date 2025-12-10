'use client'

import { useCallback, useEffect, useState } from 'react'

import { Loader2 } from 'lucide-react'

import { getMovimientosSesion } from '@/modules/caja/server'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

import type { Movimiento, SesionCaja } from '../types'
import { TablaMovimientos } from './tabla-movimientos'

interface ModalDetallesSesionProps {
  open: boolean
  onClose: () => void
  sesion: SesionCaja | null
}

export function ModalDetallesSesion({
  open,
  onClose,
  sesion
}: ModalDetallesSesionProps) {
  const [loading, setLoading] = useState(false)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])

  const cargarMovimientos = useCallback(async () => {
    if (!sesion) return

    setLoading(true)
    try {
      const result = await getMovimientosSesion(sesion.id)
      if (result.success) {
        setMovimientos(result.movimientos || [])
      }
    } catch (error) {
      console.error('Error cargando movimientos:', error)
    } finally {
      setLoading(false)
    }
  }, [sesion])

  useEffect(() => {
    if (open && sesion) {
      cargarMovimientos()
    }
  }, [open, sesion, cargarMovimientos])

  if (!sesion) return null

  const fechaApertura = new Date(sesion.fechaApertura)
  const fechaCierre = sesion.fechaCierre ? new Date(sesion.fechaCierre) : null
  const diferencia = Number(sesion.diferencia || 0)
  const hayDiferencia = Math.abs(diferencia) > 0.01

  // Calcular totales
  const totalIngresos = movimientos
    .filter(m => m.tipo === 'INGRESO')
    .reduce((sum, m) => sum + Number(m.monto), 0)

  const totalEgresos = movimientos
    .filter(m => m.tipo === 'EGRESO')
    .reduce((sum, m) => sum + Number(m.monto), 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Detalles de Sesión #{sesion.numeroSesion}</DialogTitle>
          <DialogDescription>
            {fechaApertura.toLocaleDateString('es-PE')} -{' '}
            {fechaApertura.toLocaleTimeString('es-PE')} a{' '}
            {fechaCierre?.toLocaleTimeString('es-PE')}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Resumen */}
          <div className='bg-muted space-y-2 rounded-lg p-4'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Saldo Inicial:</span>
              <span className='font-medium'>
                S/ {Number(sesion.saldoInicial).toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Ingresos:</span>
              <span className='font-medium text-emerald-400'>
                + S/ {totalIngresos.toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Egresos:</span>
              <span className='font-medium text-rose-400'>
                - S/ {totalEgresos.toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between border-t pt-2'>
              <span className='font-medium'>Saldo Teórico:</span>
              <span className='font-bold'>
                S/ {Number(sesion.saldoFinalTeorico || 0).toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Saldo Real:</span>
              <span className='font-bold'>
                S/ {Number(sesion.saldoFinalReal || 0).toFixed(2)}
              </span>
            </div>
            <div className='flex items-center justify-between border-t pt-2'>
              <span className='font-medium'>Diferencia:</span>
              {hayDiferencia ? (
                <Badge
                  variant='outline'
                  className='border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                >
                  S/ {diferencia.toFixed(2)}
                </Badge>
              ) : (
                <Badge
                  variant='outline'
                  className='border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                >
                  S/ 0.00
                </Badge>
              )}
            </div>
          </div>

          {/* Observaciones */}
          {sesion.observaciones && (
            <div className='bg-muted rounded-lg p-4'>
              <p className='mb-1 text-sm font-medium'>Observaciones:</p>
              <p className='text-muted-foreground text-sm'>
                {sesion.observaciones}
              </p>
            </div>
          )}

          {/* Movimientos */}
          <div>
            <h3 className='mb-3 font-medium'>
              Movimientos ({movimientos.length})
            </h3>
            {loading ? (
              <div className='flex justify-center py-8'>
                <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
              </div>
            ) : (
              <TablaMovimientos movimientos={movimientos} compact />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
