import z from 'zod'

export const createLoanSchema = z.object({
  clienteId: z.uuid('ID de cliente inválido'),
  montoSolicitado: z
    .number()
    .positive('El monto debe ser mayor a 0')
    .min(5, 'El monto mínimo es S/ 5')
    .max(1000000, 'El monto máximo es S/ 1,000,000'),
  tea: z
    .number()
    .positive('La TEA debe ser mayor a 0')
    .min(0.01, 'La TEA mínima es 1%')
    .max(2, 'La TEA máxima es 200%'),
  numeroCuotas: z
    .number()
    .int('El número de cuotas debe ser entero')
    .min(1, 'Mínimo 1 cuota')
    .max(72, 'Máximo 72 cuotas'),
  monedaPrestamo: z.literal('PEN'),
  monedaPago: z.literal('PEN'),
  fechaDesembolso: z
    .string()
    .refine(date => !isNaN(Date.parse(date)), 'Fecha de desembolso inválida'),
  diaVencimiento: z
    .number()
    .int('El día de vencimiento debe ser entero')
    .min(1, 'El día debe ser entre 1 y 31')
    .max(31, 'El día debe ser entre 1 y 31')
})

export type CreateLoanInput = z.infer<typeof createLoanSchema>

// Schema para actualizar préstamos DRAFT
// Solo se pueden editar: plazo, fecha de desembolso y moneda de pago
// El día de vencimiento se calcula automáticamente
export const updateLoanSchema = z.object({
  numeroCuotas: z
    .number()
    .int('El número de cuotas debe ser entero')
    .min(1, 'Mínimo 1 cuota')
    .max(72, 'Máximo 72 cuotas'),
  fechaDesembolso: z
    .string()
    .refine(date => !isNaN(Date.parse(date)), 'Fecha de desembolso inválida'),
  monedaPago: z.literal('PEN')
})

export type UpdateLoanInput = z.infer<typeof updateLoanSchema>
