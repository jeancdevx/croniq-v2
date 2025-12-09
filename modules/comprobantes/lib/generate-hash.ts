import crypto from 'crypto'

/**
 * Genera hash SHA-256 del comprobante
 * Este hash sirve como identificador único y para validación de integridad
 */
export function generateComprobanteHash(data: {
  ruc: string
  serie: string
  numero: string
  fecha: Date
  total: number
  clienteDni: string
}): string {
  const content = [
    data.ruc,
    data.serie,
    data.numero,
    data.fecha.toISOString(),
    data.total.toFixed(2),
    data.clienteDni
  ].join('|')

  return crypto.createHash('sha256').update(content).digest('hex')
}
