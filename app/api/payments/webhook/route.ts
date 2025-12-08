import { NextRequest, NextResponse } from 'next/server'

import { getFlowOrderStatus } from '@/minibackend/payments/flow-service'
import { eq } from 'drizzle-orm'

import { getDb } from '@/lib/db'
import { pagoFlow } from '@/lib/db/schema/pago-flow.schema'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const token = formData.get('token') as string

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Consultar estado en Flow para validar la transacción
    const status = await getFlowOrderStatus(token)

    console.log('Webhook Flow Recibido:', status)

    // Actualizar estado en la BD
    const db = getDb()
    if (db && status.commerceOrder) {
      let nuevoEstado = 'PENDIENTE'
      if (status.status === 2) nuevoEstado = 'PAGADO' // 2 = Pagada
      if (status.status === 3 || status.status === 4) nuevoEstado = 'RECHAZADO'

      await db
        .update(pagoFlow)
        .set({
          estado: nuevoEstado,
          fechaPago: status.status === 2 ? new Date() : null
        })
        .where(eq(pagoFlow.flowOrder, status.commerceOrder))
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
