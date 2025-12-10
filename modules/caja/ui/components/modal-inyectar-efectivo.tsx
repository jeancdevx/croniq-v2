'use client'

import { useState } from 'react'

import { Loader2, Wallet } from 'lucide-react'

import { toast } from 'sonner'

import { inyectarEfectivo } from '@/modules/caja/server'

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

interface ModalInyectarEfectivoProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  efectivoActual: number
}

export function ModalInyectarEfectivo({
  open,
  onClose,
  onSuccess,
  efectivoActual
}: ModalInyectarEfectivoProps) {
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)

  const montoNum = parseFloat(monto) || 0
  const nuevoEfectivo = efectivoActual + montoNum

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (montoNum <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    if (!descripcion.trim() || descripcion.trim().length < 3) {
      toast.error('Debe ingresar una descripción (mínimo 3 caracteres)')
      return
    }

    setLoading(true)
    try {
      const result = await inyectarEfectivo(montoNum, descripcion.trim())

      if (result.success) {
        toast.success('Efectivo inyectado correctamente')
        setMonto('')
        setDescripcion('')
        onSuccess()
        onClose()
      } else {
        toast.error(result.error || 'Error al inyectar efectivo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al inyectar efectivo')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setMonto('')
      setDescripcion('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Wallet className='h-5 w-5' />
              Inyectar Efectivo a Caja
            </DialogTitle>
            <DialogDescription>
              Agrega dinero físico a la caja para tener cambio disponible
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {/* Efectivo actual */}
            <div className='bg-muted space-y-2 rounded-lg p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  Efectivo actual en caja:
                </span>
                <span className='text-xl font-bold'>
                  S/ {efectivoActual.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Monto a agregar */}
            <div className='space-y-2'>
              <Label htmlFor='monto'>Monto a agregar *</Label>
              <Input
                id='monto'
                type='number'
                step='0.01'
                placeholder='0.00'
                value={monto}
                onChange={e => setMonto(e.target.value)}
                required
                disabled={loading}
                className='text-lg font-bold'
              />
            </div>

            {/* Nuevo efectivo disponible */}
            {montoNum > 0 && (
              <div className='bg-primary/10 rounded-lg p-3'>
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>
                    Nuevo efectivo disponible:
                  </span>
                  <span className='text-primary text-2xl font-bold'>
                    S/ {nuevoEfectivo.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Descripción */}
            <div className='space-y-2'>
              <Label htmlFor='descripcion'>Motivo *</Label>
              <Textarea
                id='descripcion'
                placeholder='Ej: Agregar efectivo para dar vueltos'
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                required
                disabled={loading}
                rows={3}
              />
              <p className='text-muted-foreground text-xs'>
                Mínimo 3 caracteres
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={loading}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Inyectar Efectivo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
