'use client'

import { useEffect, useState } from 'react'

import { Clock, TrendingDown, TrendingUp, Wallet } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>
            + S/ {resumen.totalIngresos.toFixed(2)}
          </div>
          <p className='text-muted-foreground text-xs'>
            Efectivo: S/ {resumen.desglose.ingresosEfectivo.toFixed(2)} | Flow:
            S/ {resumen.desglose.ingresosFlow.toFixed(2)}
          </p>
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
