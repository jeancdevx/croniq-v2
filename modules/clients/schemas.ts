import z from 'zod'

export const createUserSchema = z.object({
  dni: z
    .string()
    .min(1, 'DNI es requerido')
    .length(8, 'El DNI debe tener exactamente 8 dígitos')
    .regex(/^\d{8}$/, 'El DNI solo debe contener números'),
  nombres: z
    .string()
    .min(1, 'Nombres son requeridos')
    .max(100, 'Nombres deben tener máximo 100 caracteres')
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      'Los nombres solo deben contener letras'
    ),
  apellidos: z
    .string()
    .min(1, 'Apellidos son requeridos')
    .max(100, 'Apellidos deben tener máximo 100 caracteres')
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      'Los apellidos solo deben contener letras'
    ),
  direccion: z
    .string()
    .max(255, 'La dirección debe tener máximo 255 caracteres')
    .optional()
    .or(z.literal('')),
  telefono: z
    .string()
    .min(1, 'Teléfono es requerido')
    .length(9, 'El teléfono debe tener exactamente 9 dígitos')
    .regex(
      /^9\d{8}$/,
      'El teléfono debe comenzar con 9 y contener solo números'
    ),
  email: z
    .string()
    .email('Email debe ser válido')
    .max(100, 'Email debe tener máximo 100 caracteres')
    .optional()
    .or(z.literal(''))
})
