'use server'

import { capitalizeText, splitNombreCompleto } from '@/lib/text-utils'

import type { DniSearchResponse, SunatApiResponse } from '../types'

export async function searchDni(dni: string): Promise<DniSearchResponse> {
  try {
    if (!/^\d{8}$/.test(dni)) {
      return {
        success: false,
        error: 'El DNI debe tener exactamente 8 dígitos'
      }
    }

    const apiUrl = process.env.FACTILIZA_API_URL
    const bearerToken = process.env.FACTILIZA_BEARER_TOKEN

    if (!apiUrl || !bearerToken) {
      console.error('Missing FACTILIZA API configuration')
      return {
        success: false,
        error: 'Configuración de API no disponible'
      }
    }

    const url = apiUrl.includes('[DNI]')
      ? apiUrl.replace('[DNI]', dni)
      : `${apiUrl}/${dni}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: 'DNI no encontrado en RENIEC'
        }
      }

      return {
        success: false,
        error: 'Error al consultar el servicio de RENIEC'
      }
    }

    const data: SunatApiResponse = await response.json()

    if (!data.success) {
      return {
        success: false,
        error: data.message || 'No se pudo obtener la información del DNI'
      }
    }

    const { nombres, apellidos } = splitNombreCompleto(
      data.data.nombre_completo
    )
    const direccion = capitalizeText(data.data.direccion_completa)

    return {
      success: true,
      data: {
        nombres,
        apellidos,
        direccion
      }
    }
  } catch (error) {
    console.error('Error searching DNI:', error)
    return {
      success: false,
      error: 'Error de conexión. Por favor intente nuevamente.'
    }
  }
}
