'use server'

import type { Cliente } from '@/db/types'

import { getClientById as getClientByIdData } from '@/modules/clients/data/get-data'

/**
 * Server Action para obtener un cliente por ID
 * @param clientId - ID del cliente
 * @returns Cliente o null si no se encuentra
 */
export async function getClientById(clientId: string): Promise<Cliente | null> {
  try {
    return await getClientByIdData(clientId)
  } catch (error) {
    console.error('Error fetching client:', error)
    return null
  }
}
