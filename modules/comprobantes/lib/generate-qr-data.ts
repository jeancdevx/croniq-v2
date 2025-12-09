/**
 * Genera datos del QR según formato SUNAT
 * Formato: RUC|TIPO_DOC|SERIE|NUMERO|IGV|TOTAL|FECHA|TIPO_DOC_CLIENTE|NUM_DOC_CLIENTE|
 *
 * Tipos de documento:
 * - 01: Factura
 * - 03: Boleta de Venta
 *
 * Tipos de documento de identidad:
 * - 1: DNI
 * - 6: RUC
 */
export function generateQRData(data: {
  ruc: string
  tipoComprobante: 'BOLETA' | 'FACTURA'
  serie: string
  numero: string
  igv: number
  total: number
  fecha: Date
  tipoDocCliente: '1' | '6' // 1=DNI, 6=RUC
  numDocCliente: string
}): string {
  const tipoDoc = data.tipoComprobante === 'BOLETA' ? '03' : '01'
  const fechaFormateada = data.fecha.toISOString().split('T')[0] // YYYY-MM-DD

  return [
    data.ruc,
    tipoDoc,
    data.serie,
    data.numero,
    data.igv.toFixed(2),
    data.total.toFixed(2),
    fechaFormateada,
    data.tipoDocCliente,
    data.numDocCliente,
    ''
  ].join('|')
}
