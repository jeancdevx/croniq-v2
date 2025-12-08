import z from 'zod'

import { createUserSchema } from './schemas'

export type CreateUser = z.infer<typeof createUserSchema>

export interface SunatApiResponse {
  status: number
  message: string
  success: boolean
  data: {
    numero: string
    codigo_verificacion: string
    nombres: string
    apellido_paterno: string
    apellido_materno: string
    nombre_completo: string
    departamento: string
    provincia: string
    distrito: string
    direccion: string
    direccion_completa: string
    ubigeo_reniec: string
    ubigeo_sunat: string
    ubigeo: string[]
    fecha_nacimiento: string
    estado_civil: string
    foto: string
    sexo: string
  }
  fuente: number
}

export interface DniSearchResult {
  success: true
  data: {
    nombres: string
    apellidos: string
    direccion: string
  }
}

export interface DniSearchError {
  success: false
  error: string
}

export type DniSearchResponse = DniSearchResult | DniSearchError
