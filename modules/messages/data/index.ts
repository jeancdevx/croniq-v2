import type { DebtorInfo } from '@/types/reminder'
import { generateMockDebtors } from '@/lib/mock-data'

import type { Debtor } from '../types'

export async function getDebtors(): Promise<Debtor[]> {
  // Generar datos mock de deudores
  const mockDebtors: DebtorInfo[] = generateMockDebtors(new Date())

  // Mapear a formato de Debtor
  return mockDebtors.map(debtor => ({
    id: debtor.id,
    nombre: debtor.customerName,
    dni: debtor.documentNumber,
    telefono: debtor.phone,
    deuda: debtor.nextPaymentAmount,
    vencimiento: debtor.nextPaymentDate,
    estado:
      debtor.status === 'upcoming'
        ? ('proximo' as const)
        : debtor.status === 'due_today'
          ? ('vence_hoy' as const)
          : ('vencido' as const),
    diasRestantes: debtor.daysUntilPayment
  }))
}
