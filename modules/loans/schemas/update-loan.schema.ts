import { z } from 'zod'

export const updateLoanSchema = z.object({
  numeroCuotas: z
    .number()
    .int()
    .min(1, 'El plazo mínimo es 1 mes')
    .max(72, 'El plazo máximo es 72 meses'),
  fechaDesembolso: z.string().min(1, 'La fecha de desembolso es requerida'),
  monedaPago: z.enum(['USD', 'PEN'], {
    message: 'Debe seleccionar la moneda de pago'
  }),
  diaVencimiento: z
    .number()
    .int()
    .min(1, 'El día debe ser entre 1 y 31')
    .max(31, 'El día debe ser entre 1 y 31')
})

export type UpdateLoanInput = z.infer<typeof updateLoanSchema>
