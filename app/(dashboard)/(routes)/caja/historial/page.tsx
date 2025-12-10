'use client'

import { useEffect, useState } from 'react'

import { Eye, Loader2 } from 'lucide-react'

import { toast } from 'sonner'

import { getHistorialSesiones } from '@/modules/caja/server'
import { ModalDetallesSesion } from '@/modules/caja/ui/components'
import type { SesionCaja } from '@/modules/caja/ui/types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

export default function HistorialCajaPage() {
  const [loading, setLoading] = useState(true)
  const [sesiones, setSesiones] = useState<SesionCaja[]>([])
  const [sesionSeleccionada, setSesionSeleccionada] =
    useState<SesionCaja | null>(null)
  const [showDetalles, setShowDetalles] = useState(false)

  const cargarHistorial = async () => {
    setLoading(true)
    try {
      const result = await getHistorialSesiones(50, 0)
      if (result.success) {
        setSesiones(result.sesiones || [])
      } else {
        toast.error(result.error || 'Error al cargar historial')
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
      toast.error('Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarHistorial()
  }, [])

  const handleVerDetalles = (sesion: SesionCaja) => {
    setSesionSeleccionada(sesion)
    setShowDetalles(true)
  }

  if (loading) {
    return (
      <div className='flex h-[50vh] items-center justify-center'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>
          Historial de Sesiones
        </h1>
        <p className='text-muted-foreground'>
          Consulta las sesiones de caja cerradas
        </p>
      </div>

      {/* Tabla de Sesiones */}
      <Card>
        <CardHeader>
          <CardTitle>Sesiones Cerradas</CardTitle>
          <CardDescription>
            {sesiones.length} sesión(es) registrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sesiones.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center'>
              No hay sesiones cerradas aún
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sesión</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Apertura</TableHead>
                  <TableHead>Cierre</TableHead>
                  <TableHead className='text-right'>Saldo Inicial</TableHead>
                  <TableHead className='text-right'>Saldo Final</TableHead>
                  <TableHead className='text-right'>Diferencia</TableHead>
                  <TableHead className='text-center'>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sesiones.map(sesion => {
                  const fechaApertura = new Date(sesion.fechaApertura)
                  const fechaCierre = sesion.fechaCierre
                    ? new Date(sesion.fechaCierre)
                    : null
                  const diferencia = Number(sesion.diferencia || 0)
                  const hayDiferencia = Math.abs(diferencia) > 0.01

                  return (
                    <TableRow key={sesion.id}>
                      <TableCell className='font-medium'>
                        #{sesion.numeroSesion}
                      </TableCell>
                      <TableCell>
                        {fechaApertura.toLocaleDateString('es-PE')}
                      </TableCell>
                      <TableCell>
                        {fechaApertura.toLocaleTimeString('es-PE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        {fechaCierre
                          ? fechaCierre.toLocaleTimeString('es-PE', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className='text-right'>
                        S/ {Number(sesion.saldoInicial).toFixed(2)}
                      </TableCell>
                      <TableCell className='text-right font-medium'>
                        S/ {Number(sesion.saldoFinalReal || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className='text-right'>
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
                      </TableCell>
                      <TableCell className='text-center'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleVerDetalles(sesion)}
                        >
                          <Eye className='mr-2 h-4 w-4' />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <ModalDetallesSesion
        open={showDetalles}
        onClose={() => setShowDetalles(false)}
        sesion={sesionSeleccionada}
      />
    </div>
  )
}
