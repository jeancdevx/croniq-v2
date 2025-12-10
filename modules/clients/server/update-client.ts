'use server'

import { revalidatePath } from 'next/cache'

import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { cliente } from '@/db/schema'

import { createUserSchema } from '../schemas'

export const updateClient = async (id: string, formData: FormData) => {
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

    // Check if another client has the same DNI (excluding current client)
    const existingClient = await db
      .select()
      .from(cliente)
      .where(eq(cliente.dni, validatedData.dni))
      .limit(1)

    if (existingClient.length > 0 && existingClient[0].id !== id) {
      return {
        success: false,
        error: 'Ya existe otro cliente registrado con este DNI'
      }
    }

    const [updatedClient] = await db
      .update(cliente)
      .set({
        dni: validatedData.dni,
        nombres: validatedData.nombres,
        apellidos: validatedData.apellidos,
        direccion: validatedData.direccion || null,
        telefono: validatedData.telefono,
        email: validatedData.email || null
      })
      .where(eq(cliente.id, id))
      .returning()

    revalidatePath('/clients')

    return {
      success: true,
      data: updatedClient,
      message: 'Cliente actualizado exitosamente'
    }
  } catch (error) {
    console.error('Error updating client:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: false,
      error: 'Error al actualizar el cliente'
    }
  }
}
