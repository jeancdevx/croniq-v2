'use server'

import { differenceInDays, parseISO, startOfDay } from 'date-fns'
import { and, asc, eq, ne } from 'drizzle-orm'

import { getDb } from '@/db'
import { cliente, cuota, prestamo } from '@/db/schema'

import type { Debtor } from '../types'

export async function getDebtors(): Promise<Debtor[]> {
  const db = getDb()

  // 1. Get all active loans with their client and earliest pending installment
  const activeLoans = await db
    .select({
      loanId: prestamo.id,
      cliente: {
        id: cliente.id,
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        dni: cliente.dni,
        telefono: cliente.telefono
      },
      cuota: {
        id: cuota.id,
        fechaVencimiento: cuota.fechaVencimiento,
        saldoPendiente: cuota.saldoPendiente,
        totalConSeguro: cuota.totalConSeguro,
        numeroCuota: cuota.numeroCuota
      }
    })
    .from(prestamo)
    .innerJoin(cliente, eq(prestamo.clienteId, cliente.id))
    .innerJoin(cuota, eq(prestamo.id, cuota.prestamoId))
    .where(and(eq(prestamo.estado, 'ACTIVO'), ne(cuota.estado, 'PAGADO')))
    .orderBy(asc(cuota.fechaVencimiento))

  // 2. Process to find the earliest pending installment per loan
  const debtorsMap = new Map<string, Debtor>()
  const today = startOfDay(new Date())

  for (const row of activeLoans) {
    if (debtorsMap.has(row.loanId)) {
      continue // Already have the earliest pending installment for this loan
    }

    const fechaVencimiento = parseISO(row.cuota.fechaVencimiento)
    const diasRestantes = differenceInDays(fechaVencimiento, today)

    let estado: Debtor['estado']
    if (diasRestantes < 0) {
      estado = 'vencido'
    } else if (diasRestantes === 0) {
      estado = 'vence_hoy'
    } else {
      estado = 'proximo'
    }

    const deuda = Number(row.cuota.saldoPendiente ?? row.cuota.totalConSeguro)

    debtorsMap.set(row.loanId, {
      id: row.cliente.id,
      nombre: `${row.cliente.nombres} ${row.cliente.apellidos}`,
      dni: row.cliente.dni,
      telefono: row.cliente.telefono,
      deuda,
      vencimiento: row.cuota.fechaVencimiento,
      estado,
      diasRestantes
    })
  }

  return Array.from(debtorsMap.values())
}
