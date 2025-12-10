'use client'

import { useState } from 'react'

import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ModalAbrirCajaProps {
  open: boolean
  onClose: () => void
  onConfirm: (observaciones?: string) => Promise<void>
  saldoInicial?: number
}

export function ModalAbrirCaja({
  open,
  onClose,
  onConfirm,
  saldoInicial = 0
}: ModalAbrirCajaProps) {
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      await onConfirm(observaciones || undefined)
      setObservaciones('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Abrir Sesión de Caja</DialogTitle>
            <DialogDescription>
              El saldo inicial se hereda automáticamente de la sesión anterior
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {/* Saldo Inicial (solo lectura) */}
            <div className='bg-muted space-y-2 rounded-lg p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  Saldo Inicial:
                </span>
                <span className='text-2xl font-bold'>
                  S/ {saldoInicial.toFixed(2)}
                </span>
              </div>
              <p className='text-muted-foreground text-xs'>
                Heredado del saldo final de la sesión anterior
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='obs'>Observaciones (opcional)</Label>
              <Textarea
                id='obs'
                placeholder='Ej: Apertura de caja turno mañana'
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
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
            <Button type='submit' disabled={loading}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Abrir Caja
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
