'use client'

import { useEffect, useState } from 'react'

import { Clock, TrendingDown, TrendingUp, Wallet } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import type { ResumenSesion, SesionCaja } from '../types'

interface ResumenSesionProps {
  sesion: SesionCaja
  resumen: ResumenSesion
}

export function ResumenSesion({ sesion, resumen }: ResumenSesionProps) {
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0)

  useEffect(() => {
    const fechaApertura = new Date(sesion.fechaApertura)

    const calcularTiempo = () => {
      const minutos = Math.floor(
        (Date.now() - fechaApertura.getTime()) / 1000 / 60
      )
      setTiempoTranscurrido(minutos)
    }

    calcularTiempo()
    const interval = setInterval(calcularTiempo, 60000) // Actualizar cada minuto

    return () => clearInterval(interval)
  }, [sesion.fechaApertura])

  const horas = Math.floor(tiempoTranscurrido / 60)
  const minutos = tiempoTranscurrido % 60
  const fechaApertura = new Date(sesion.fechaApertura)

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {/* Saldo Actual */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Saldo Actual</CardTitle>
          <Wallet className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            S/ {resumen.saldoTeorico.toFixed(2)}
          </div>
          <p className='text-muted-foreground text-xs'>
            Inicial: S/ {resumen.saldoInicial.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {/* Ingresos */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Ingresos</CardTitle>
          <TrendingUp className='h-4 w-4 text-green-600' />
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='text-2xl font-bold text-green-600'>
              + S/ {resumen.totalIngresos.toFixed(2)}
            </div>
            <p className='text-muted-foreground text-xs'>Total</p>
          </div>

          <Separator />

          {/* Desglose detallado */}
          <div className='space-y-2'>
            <h4 className='text-sm font-semibold'>Desglose de Ingresos</h4>

            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Pagos en Efectivo:</span>
              <span className='font-medium text-emerald-400'>
                S/ {(resumen.desglose?.ingresosEfectivo || 0).toFixed(2)}
              </span>
            </div>

            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>
                Pagos con Tarjeta/Flow:
              </span>
              <span className='font-medium text-blue-400'>
                S/ {(resumen.desglose?.ingresosTarjeta || 0).toFixed(2)}
              </span>
            </div>

            {resumen.desglose?.inyeccionesEfectivo > 0 && (
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>
                  Inyecciones de Efectivo:
                </span>
                <span className='font-medium text-purple-400'>
                  S/ {resumen.desglose.inyeccionesEfectivo.toFixed(2)}
                </span>
              </div>
            )}

            {resumen.desglose?.comisionesFlow > 0 && (
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Comisiones Flow:</span>
                <span className='font-medium text-orange-400'>
                  S/ {resumen.desglose.comisionesFlow.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Efectivo disponible - destacado */}
          <div className='bg-primary/10 rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-semibold'>Efectivo Disponible</p>
                <p className='text-muted-foreground text-xs'>
                  Dinero físico en caja para dar vueltos
                </p>
              </div>
              <span className='text-primary text-2xl font-bold'>
                S/ {(resumen.desglose?.efectivoDisponible || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Egresos */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Egresos</CardTitle>
          <TrendingDown className='h-4 w-4 text-red-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-red-600'>
            - S/ {resumen.totalEgresos.toFixed(2)}
          </div>
          <p className='text-muted-foreground text-xs'>
            Desembolsos realizados
          </p>
        </CardContent>
      </Card>

      {/* Tiempo */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Sesión #{sesion.numeroSesion}
          </CardTitle>
          <Clock className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {horas}h {minutos}m
          </div>
          <p className='text-muted-foreground text-xs'>
            Abierta desde {fechaApertura.toLocaleTimeString('es-PE')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
