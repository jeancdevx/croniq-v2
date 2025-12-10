'use client'

import { useEffect, useState } from 'react'

import { Loader2, Lock, Unlock } from 'lucide-react'

import { toast } from 'sonner'

import { abrirCaja, cerrarCaja, getSesionActual } from '@/modules/caja/server'
import { ModalAbrirCaja } from '@/modules/caja/ui/components/modal-abrir-caja'
import { ModalCerrarCaja } from '@/modules/caja/ui/components/modal-cerrar-caja'
import { ResumenSesion } from '@/modules/caja/ui/components/resumen-sesion'
import { TablaMovimientos } from '@/modules/caja/ui/components/tabla-movimientos'
import type {
  Movimiento,
  ResumenSesion as ResumenSesionType,
  SesionCaja
} from '@/modules/caja/ui/types'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

interface SesionData {
  success: boolean
  sesionAbierta?: boolean
  sesion?: SesionCaja | null
  resumen?: ResumenSesionType
  movimientos?: Movimiento[]
  error?: string
}

export default function CajaPage() {
  const [loading, setLoading] = useState(true)
  const [sesionData, setSesionData] = useState<SesionData | null>(null)
  const [showAbrirModal, setShowAbrirModal] = useState(false)
  const [showCerrarModal, setShowCerrarModal] = useState(false)
  const [saldoInicialSugerido, setSaldoInicialSugerido] = useState(0)

  const cargarSesion = async () => {
    setLoading(true)
    try {
      const result = await getSesionActual()
      if (result.success) {
        setSesionData(result)

        // Si no hay sesión abierta, calcular saldo sugerido
        if (!result.sesionAbierta) {
          // Obtener última sesión cerrada para sugerir saldo
          const { getHistorialSesiones } = await import('@/modules/caja/server')
          const historial = await getHistorialSesiones(1, 0)
          if (
            historial.success &&
            historial.sesiones &&
            historial.sesiones.length > 0
          ) {
            const ultimaSesion = historial.sesiones[0]
            setSaldoInicialSugerido(Number(ultimaSesion.saldoFinalReal || 0))
          } else {
            setSaldoInicialSugerido(0)
          }
        } else {
          setSaldoInicialSugerido(0)
        }
      } else {
        toast.error(result.error || 'Error al cargar sesión')
      }
    } catch (error) {
      console.error('Error cargando sesión:', error)
      toast.error('Error al cargar sesión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarSesion()
  }, [])

  const handleAbrirCaja = async (observaciones?: string) => {
    try {
      const result = await abrirCaja(observaciones)
      if (result.success) {
        toast.success('Caja abierta exitosamente')
        setShowAbrirModal(false)
        await cargarSesion()
      } else {
        toast.error(result.error || 'Error al abrir caja')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al abrir caja')
    }
  }

  const handleCerrarCaja = async (
    saldoReal: number,
    observaciones?: string
  ) => {
    try {
      const result = await cerrarCaja(saldoReal, observaciones)
      if (result.success) {
        toast.success('Caja cerrada exitosamente')
        setShowCerrarModal(false)
        await cargarSesion()
      } else {
        toast.error(result.error || 'Error al cerrar caja')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cerrar caja')
    }
  }

  if (loading) {
    return (
      <div className='flex h-[50vh] items-center justify-center'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    )
  }

  const sesionAbierta = sesionData?.sesionAbierta
  const sesion = sesionData?.sesion
  const resumen = sesionData?.resumen
  const movimientos = sesionData?.movimientos || []

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Cuadre de Caja</h1>
          <p className='text-muted-foreground'>
            Gestiona las sesiones de caja y movimientos
          </p>
        </div>
        {sesionAbierta ? (
          <Button
            onClick={() => setShowCerrarModal(true)}
            variant='destructive'
          >
            <Lock className='mr-2 h-4 w-4' />
            Cerrar Caja
          </Button>
        ) : (
          <Button onClick={() => setShowAbrirModal(true)}>
            <Unlock className='mr-2 h-4 w-4' />
            Abrir Caja
          </Button>
        )}
      </div>

      {/* Estado de Caja */}
      {sesionAbierta ? (
        <>
          <ResumenSesion sesion={sesion!} resumen={resumen!} />
          <TablaMovimientos movimientos={movimientos || []} />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Lock className='text-muted-foreground h-5 w-5' />
              Caja Cerrada
            </CardTitle>
            <CardDescription>
              No hay ninguna sesión de caja abierta actualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col items-center justify-center py-8'>
              <p className='text-muted-foreground mb-4 text-center'>
                Debes abrir una sesión de caja para comenzar a operar
              </p>
              <Button onClick={() => setShowAbrirModal(true)} size='lg'>
                <Unlock className='mr-2 h-5 w-5' />
                Abrir Caja
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <ModalAbrirCaja
        open={showAbrirModal}
        onClose={() => setShowAbrirModal(false)}
        onConfirm={handleAbrirCaja}
        saldoInicial={saldoInicialSugerido}
      />
      <ModalCerrarCaja
        open={showCerrarModal}
        onClose={() => setShowCerrarModal(false)}
        onConfirm={handleCerrarCaja}
        sesion={sesion ?? null}
        resumen={resumen ?? null}
      />
    </div>
  )
}
