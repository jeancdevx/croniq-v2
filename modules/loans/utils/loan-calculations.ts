import {
  CuotaPrestamo,
  Prestamo,
  RegistroPrestamoForm
} from '@/modules/loans/domain/types'

/**
 * Genera el cronograma de pagos para un préstamo
 */
export function generarCronogramaPagos(
  fechaDesembolso: string,
  cuotaMensual: number,
  plazo: number
): CuotaPrestamo[] {
  const cronograma: CuotaPrestamo[] = []
  const fechaInicio = new Date(fechaDesembolso)

  for (let i = 1; i <= plazo; i++) {
    const fechaVencimiento = new Date(fechaInicio)
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i)

    cronograma.push({
      numeroCuota: i,
      fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
      montoCuota: cuotaMensual,
      montoPagado: 0,
      moraPagada: 0,
      moraAcumulada: 0,
      diasAtraso: 0,
      estado: 'pendiente',
      fechaPago: null
    })
  }

  return cronograma
}

/**
 * Calcula la cuota mensual fija usando el sistema francés
 */
export function calcularCuotaMensual(
  monto: number,
  tasaAnual: number,
  plazo: number
): number {
  if (tasaAnual === 0) {
    return monto / plazo
  }

  const tasaMensual = Math.pow(1 + tasaAnual / 100, 1 / 12) - 1
  const factor = Math.pow(1 + tasaMensual, plazo)
  const cuota = monto * ((tasaMensual * factor) / (factor - 1))

  return cuota
}

/**
 * Calcula la TCEA (Tasa de Costo Efectivo Anual)
 */
export function calcularTCEA(
  monto: number,
  totalPagar: number,
  plazo: number
): number {
  if (totalPagar <= monto) return 0
  return (Math.pow(totalPagar / monto, 12 / plazo) - 1) * 100
}

/**
 * Calcula la mora acumulada por días de atraso
 * Mora = 1% mensual = 0.0333% diario
 */
export function calcularMora(montoCuota: number, diasAtraso: number): number {
  const moraMensual = montoCuota * 0.01
  const moraDiaria = moraMensual / 30
  return moraDiaria * diasAtraso
}

/**
 * Calcula los días de atraso entre la fecha de vencimiento y hoy
 */
export function calcularDiasAtraso(fechaVencimiento: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const vencimiento = new Date(fechaVencimiento)
  vencimiento.setHours(0, 0, 0, 0)

  if (hoy <= vencimiento) return 0

  const diferencia = hoy.getTime() - vencimiento.getTime()
  return Math.floor(diferencia / (1000 * 60 * 60 * 24))
}

/**
 * Actualiza el estado de las cuotas según las fechas
 */
export function actualizarEstadoCuotas(prestamo: Prestamo): Prestamo {
  const cronogramaActualizado = prestamo.cronogramaPagos.map(cuota => {
    if (cuota.estado === 'pagada') return cuota

    const diasAtraso = calcularDiasAtraso(cuota.fechaVencimiento)
    const moraAcumulada =
      diasAtraso > 0 ? calcularMora(cuota.montoCuota, diasAtraso) : 0

    return {
      ...cuota,
      diasAtraso,
      moraAcumulada,
      estado: diasAtraso > 0 ? ('atrasada' as const) : ('pendiente' as const)
    }
  })

  return {
    ...prestamo,
    cronogramaPagos: cronogramaActualizado
  }
}

/**
 * Crea un nuevo préstamo desde el formulario
 */
export function crearPrestamo(form: RegistroPrestamoForm): Prestamo {
  const cuotaMensual = calcularCuotaMensual(
    form.monto,
    form.tasaAnual,
    form.plazo
  )
  const totalPagar = cuotaMensual * form.plazo
  const tcea = calcularTCEA(form.monto, totalPagar, form.plazo)
  const moraMensual = form.monto * 0.01

  const prestamo: Prestamo = {
    id: `PREST-${Date.now()}`,
    fechaRegistro: new Date().toISOString(),
    fechaDesembolso: form.fechaDesembolso,
    cliente: {
      dni: form.dni,
      nombres: form.nombres,
      apellidos: form.apellidos,
      nombreCompleto: `${form.nombres} ${form.apellidos}`,
      esPep: form.esPep
    },
    monto: form.monto,
    plazo: form.plazo,
    tasaAnualFija: form.tasaAnual,
    cuotaMensual,
    moraMensual,
    totalPagar,
    tcea,
    cronogramaPagos: generarCronogramaPagos(
      form.fechaDesembolso,
      cuotaMensual,
      form.plazo
    )
  }

  return prestamo
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD
 */
export function obtenerFechaHoy(): string {
  const hoy = new Date()
  return hoy.toISOString().split('T')[0]
}

/**
 * Formatea una fecha a formato local
 */
export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-PE')
}

/**
 * Formatea una fecha y hora a formato local
 */
export function formatearFechaHora(fecha: string): string {
  const date = new Date(fecha)
  return `${date.toLocaleDateString('es-PE')} ${date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
}
