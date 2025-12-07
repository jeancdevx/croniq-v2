'use client'

import { Prestamo } from '../domain/types'

const STORAGE_KEY = 'croniq_prestamos'

export function guardarPrestamos(prestamos: Prestamo[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prestamos))
}

export function cargarPrestamos(): Prestamo[] {
  if (typeof window === 'undefined') return []

  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []

  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function agregarPrestamo(prestamo: Prestamo): Prestamo[] {
  const prestamos = cargarPrestamos()
  prestamos.push(prestamo)
  guardarPrestamos(prestamos)
  return prestamos
}

export function actualizarPrestamo(prestamoActualizado: Prestamo): Prestamo[] {
  const prestamos = cargarPrestamos()
  const index = prestamos.findIndex(p => p.id === prestamoActualizado.id)

  if (index !== -1) {
    prestamos[index] = prestamoActualizado
    guardarPrestamos(prestamos)
  }

  return prestamos
}

export function eliminarTodosPrestamos(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function exportarPrestamosCSV(prestamos: Prestamo[]): void {
  if (prestamos.length === 0) {
    alert('No hay préstamos para exportar.')
    return
  }

  const headers = [
    'Fecha Registro',
    'Nombre',
    'DNI',
    'PEP',
    'Monto (S/.)',
    'Plazo (Meses)',
    'Cuota Fija (S/.)',
    'Mora Mensual (1%)',
    'Total a Pagar (S/.)',
    'TCEA'
  ]

  const rows = prestamos.map(p => [
    new Date(p.fechaRegistro).toLocaleString('es-PE'),
    p.cliente.nombreCompleto,
    p.cliente.dni,
    p.cliente.esPep ? 'Sí' : 'No',
    p.monto.toFixed(2),
    p.plazo,
    p.cuotaMensual.toFixed(2),
    p.moraMensual.toFixed(2),
    p.totalPagar.toFixed(2),
    `${p.tcea.toFixed(2)}%`
  ])

  let csvContent = headers.join(',') + '\n'
  rows.forEach(row => {
    csvContent += row.join(',') + '\n'
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `prestamos_${Date.now()}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
