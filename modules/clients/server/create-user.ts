'use server'

import { revalidatePath } from 'next/cache'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cliente } from '@/db/schema'

import { createUserSchema } from '../schemas'

export const createUser = async (formData: FormData) => {
  try {
    const rawData = {
      dni: formData.get('dni'),
      nombres: formData.get('nombres'),
      apellidos: formData.get('apellidos'),
      direccion: formData.get('direccion'),
      telefono: formData.get('telefono'),
      email: formData.get('email')
    }

    const validatedData = createUserSchema.parse(rawData)

    const db = getDb()

    const existingClient = await db
      .select()
      .from(cliente)
      .where(eq(cliente.dni, validatedData.dni))
      .limit(1)

    if (existingClient.length > 0) {
      return {
        success: false,
        error: 'Ya existe un cliente registrado con este DNI'
      }
    }

    const [newClient] = await db
      .insert(cliente)
      .values({
        dni: validatedData.dni,
        nombres: validatedData.nombres,
        apellidos: validatedData.apellidos,
        direccion: validatedData.direccion || null,
        telefono: validatedData.telefono,
        email: validatedData.email || null
      })
      .returning()

    revalidatePath('/clients')

    return {
      success: true,
      data: newClient,
      message: 'Cliente creado exitosamente'
    }
  } catch (error) {
    console.error('Error creating client:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: false,
      error: 'Error al crear el cliente'
    }
  }
}
