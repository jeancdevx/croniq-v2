'use client'

import { useState } from 'react'

import { AlertTriangle, Loader2 } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import type { ResumenSesion, SesionCaja } from '../types'

interface ModalCerrarCajaProps {
  open: boolean
  onClose: () => void
  onConfirm: (saldoReal: number, observaciones?: string) => Promise<void>
  sesion: SesionCaja | null
  resumen: ResumenSesion | null
}

export function ModalCerrarCaja({
  open,
  onClose,
  onConfirm,
  sesion,
  resumen
}: ModalCerrarCajaProps) {
  const [saldoReal, setSaldoReal] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(false)

  const saldoTeorico = resumen?.saldoTeorico || 0
  const saldoRealNum = parseFloat(saldoReal) || 0
  const diferencia = saldoRealNum - saldoTeorico
  const hayDiferencia = Math.abs(diferencia) > 0.01

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isNaN(saldoRealNum)) {
      return
    }

    if (hayDiferencia && !observaciones.trim()) {
      return
    }

    setLoading(true)
    try {
      await onConfirm(saldoRealNum, observaciones || undefined)
      setSaldoReal('')
      setObservaciones('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Cerrar Sesión de Caja</DialogTitle>
            <DialogDescription>
              Sesión #{sesion?.numeroSesion} - Verifica el saldo antes de cerrar
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {/* Resumen */}
            <div className='bg-muted space-y-2 rounded-lg p-4'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Saldo Inicial:</span>
                <span className='font-medium'>
                  S/ {Number(sesion?.saldoInicial || 0).toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Ingresos:</span>
                <span className='font-medium text-emerald-400'>
                  + S/ {(resumen?.totalIngresos || 0).toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Egresos:</span>
                <span className='font-medium text-rose-400'>
                  - S/ {(resumen?.totalEgresos || 0).toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between border-t pt-2 font-bold'>
                <span>Saldo Teórico:</span>
                <span>S/ {saldoTeorico.toFixed(2)}</span>
              </div>
            </div>

            {/* Saldo Real */}
            <div className='space-y-2'>
              <Label htmlFor='saldoReal'>
                Saldo Real (Consulta tu cuenta) *
              </Label>
              <Input
                id='saldoReal'
                type='number'
                step='0.01'
                placeholder='0.00'
                value={saldoReal}
                onChange={e => setSaldoReal(e.target.value)}
                required
                className='text-lg font-bold'
              />
            </div>

            {/* Diferencia */}
            {saldoReal && (
              <div
                className={`rounded-lg p-3 ${
                  hayDiferencia
                    ? 'border border-yellow-500/20 bg-yellow-500/10'
                    : 'border border-emerald-500/20 bg-emerald-500/10'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>Diferencia:</span>
                  <span
                    className={`text-lg font-bold ${
                      hayDiferencia ? 'text-yellow-400' : 'text-emerald-400'
                    }`}
                  >
                    S/ {diferencia.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Observaciones */}
            {hayDiferencia && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  Hay una diferencia. Debes explicar el motivo en observaciones.
                </AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='obs'>Observaciones {hayDiferencia && '*'}</Label>
              <Textarea
                id='obs'
                placeholder={
                  hayDiferencia
                    ? 'Explica la diferencia encontrada...'
                    : 'Observaciones opcionales...'
                }
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                required={hayDiferencia}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type='submit'
              disabled={loading || (hayDiferencia && !observaciones.trim())}
              variant={hayDiferencia ? 'destructive' : 'default'}
            >
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Cerrar Caja
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
