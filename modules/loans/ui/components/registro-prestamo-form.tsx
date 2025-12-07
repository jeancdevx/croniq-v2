'use client'

import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Prestamo } from '@/modules/loans/domain/types'
import { agregarPrestamo } from '@/modules/loans/services/storage'
import {
  crearPrestamo,
  obtenerFechaHoy
} from '@/modules/loans/utils/loan-calculations'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const formSchema = z.object({
  dni: z
    .string()
    .length(8, 'El DNI debe tener 8 dígitos')
    .regex(/^\d+$/, 'Solo números'),
  nombres: z.string().min(2, 'Ingresa los nombres'),
  apellidos: z.string().min(2, 'Ingresa los apellidos'),
  esPep: z.boolean(),
  monto: z.number().min(1, 'El monto debe ser mayor a 0'),
  plazo: z.number().int().min(1, 'El plazo debe ser al menos 1 mes'),
  tasaAnual: z.number().min(0.01, 'La tasa debe ser mayor a 0'),
  fechaDesembolso: z.string()
})

type FormValues = z.infer<typeof formSchema>

interface RegistroPrestamoFormProps {
  onPrestamoCreado: (prestamo: Prestamo) => void
}

export function RegistroPrestamoForm({
  onPrestamoCreado
}: RegistroPrestamoFormProps) {
  const [esPep, setEsPep] = useState(false)
  const fechaHoy = obtenerFechaHoy()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dni: '',
      nombres: '',
      apellidos: '',
      esPep: false,
      monto: 0,
      plazo: 12,
      tasaAnual: 20,
      fechaDesembolso: fechaHoy
    }
  })

  const onSubmit = (data: FormValues) => {
    const prestamo = crearPrestamo({
      ...data,
      esPep
    })

    agregarPrestamo(prestamo)
    onPrestamoCreado(prestamo)

    reset()
    setEsPep(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📋 Registrar Nuevo Préstamo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Información del Cliente */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold'>
              👤 Información del Cliente
            </h3>

            <div>
              <Label htmlFor='dni'>DNI (8 dígitos)</Label>
              <Input
                id='dni'
                {...register('dni')}
                placeholder='Ingresa 8 dígitos (ej: 12345678)'
                maxLength={8}
              />
              {errors.dni && (
                <p className='text-destructive mt-1 text-sm'>
                  {errors.dni.message}
                </p>
              )}
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='nombres'>Nombres</Label>
                <Input
                  id='nombres'
                  {...register('nombres')}
                  placeholder='Ingresa los nombres'
                />
                {errors.nombres && (
                  <p className='text-destructive mt-1 text-sm'>
                    {errors.nombres.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='apellidos'>Apellidos</Label>
                <Input
                  id='apellidos'
                  {...register('apellidos')}
                  placeholder='Ingresa los apellidos'
                />
                {errors.apellidos && (
                  <p className='text-destructive mt-1 text-sm'>
                    {errors.apellidos.message}
                  </p>
                )}
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Checkbox
                id='esPep'
                checked={esPep}
                onCheckedChange={checked => setEsPep(!!checked)}
              />
              <Label htmlFor='esPep' className='cursor-pointer'>
                ¿Es Persona Expuesta Políticamente (PEP)?
              </Label>
            </div>
          </div>

          {/* Detalles del Préstamo */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold'>💰 Detalles del Préstamo</h3>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='monto'>Monto del Préstamo (S/.)</Label>
                <Input
                  id='monto'
                  type='number'
                  step='0.01'
                  {...register('monto', { valueAsNumber: true })}
                  placeholder='Ej: 5000'
                />
                {errors.monto && (
                  <p className='text-destructive mt-1 text-sm'>
                    {errors.monto.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='fechaDesembolso'>Fecha de Desembolso</Label>
                <Input
                  id='fechaDesembolso'
                  type='date'
                  {...register('fechaDesembolso')}
                  min={fechaHoy}
                  max={fechaHoy}
                />
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='plazo'>Plazo (meses)</Label>
                <Input
                  id='plazo'
                  type='number'
                  {...register('plazo', { valueAsNumber: true })}
                  placeholder='Ej: 12'
                />
                {errors.plazo && (
                  <p className='text-destructive mt-1 text-sm'>
                    {errors.plazo.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='tasaAnual'>Tasa de Interés Anual (Fijo)</Label>
                <Input
                  id='tasaAnual'
                  type='number'
                  step='0.01'
                  {...register('tasaAnual', { valueAsNumber: true })}
                  placeholder='Ej: 10.00 (%)'
                />
                {errors.tasaAnual && (
                  <p className='text-destructive mt-1 text-sm'>
                    {errors.tasaAnual.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Tipo de Cálculo</Label>
              <Input value='Amortizado (Cuotas Fijas)' readOnly />
              <p className='text-muted-foreground mt-1 text-xs'>
                Este cálculo utiliza el sistema de cuotas mensuales fijas.
              </p>
            </div>

            <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20'>
              <Label className='text-amber-700 dark:text-amber-500'>
                ⚠️ Tasa de Mora
              </Label>
              <Input
                value='1% mensual sobre saldo pendiente'
                readOnly
                className='border-amber-200 bg-amber-100/50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
              />
              <p className='text-muted-foreground mt-1 text-xs'>
                Se aplicará en caso de no cancelar la cuota a tiempo.
              </p>
            </div>
          </div>

          <Button type='submit' className='w-full'>
            <span className='mr-2'>📑</span> Registrar Préstamo
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
