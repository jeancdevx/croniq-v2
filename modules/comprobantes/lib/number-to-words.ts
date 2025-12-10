/**
 * Convierte un número a su representación en letras (español - Perú)
 * Ejemplo: 123.45 -> "CIENTO VEINTITRÉS CON 45/100 SOLES"
 */

const UNIDADES = [
  '',
  'UNO',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE'
]

const DECENAS = [
  '',
  '',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA'
]

const ESPECIALES = [
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISÉIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE'
]

const CENTENAS = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS'
]

/**
 * Convierte un número de 0-99 a palabras
 */
function convertirDecenas(num: number): string {
  if (num < 10) {
    return UNIDADES[num]
  }

  if (num >= 10 && num < 20) {
    return ESPECIALES[num - 10]
  }

  const decena = Math.floor(num / 10)
  const unidad = num % 10

  if (num === 20) {
    return 'VEINTE'
  }

  if (decena === 2 && unidad > 0) {
    return `VEINTI${UNIDADES[unidad]}`
  }

  if (unidad === 0) {
    return DECENAS[decena]
  }

  return `${DECENAS[decena]} Y ${UNIDADES[unidad]}`
}

/**
 * Convierte un número de 0-999 a palabras
 */
function convertirCentenas(num: number): string {
  if (num === 0) return ''
  if (num === 100) return 'CIEN'

  const centena = Math.floor(num / 100)
  const resto = num % 100

  if (centena === 0) {
    return convertirDecenas(resto)
  }

  if (resto === 0) {
    return centena === 1 ? 'CIEN' : CENTENAS[centena]
  }

  return `${CENTENAS[centena]} ${convertirDecenas(resto)}`
}

/**
 * Convierte un número de 0-999999 a palabras
 */
function convertirMiles(num: number): string {
  if (num === 0) return 'CERO'
  if (num < 1000) return convertirCentenas(num)

  const miles = Math.floor(num / 1000)
  const resto = num % 1000

  let resultado = ''

  if (miles === 1) {
    resultado = 'MIL'
  } else {
    resultado = `${convertirCentenas(miles)} MIL`
  }

  if (resto > 0) {
    resultado += ` ${convertirCentenas(resto)}`
  }

  return resultado
}

/**
 * Convierte un número completo a palabras (hasta millones)
 */
function convertirNumeroCompleto(num: number): string {
  if (num === 0) return 'CERO'
  if (num < 1000000) return convertirMiles(num)

  const millones = Math.floor(num / 1000000)
  const resto = num % 1000000

  let resultado = ''

  if (millones === 1) {
    resultado = 'UN MILLÓN'
  } else {
    resultado = `${convertirMiles(millones)} MILLONES`
  }

  if (resto > 0) {
    resultado += ` ${convertirMiles(resto)}`
  }

  return resultado
}

/**
 * Convierte un monto a su representación en letras para comprobantes
 * @param amount - Monto numérico (puede ser string o number)
 * @param currency - Código de moneda (PEN o USD)
 * @returns Texto en formato "CIENTO VEINTITRÉS CON 45/100 SOLES"
 */
export function numberToWords(
  amount: number | string,
  currency: string = 'PEN'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(num)) {
    return 'CERO CON 00/100 SOLES'
  }

  // Separar parte entera y decimal
  const parteEntera = Math.floor(Math.abs(num))
  const parteDecimal = Math.round((Math.abs(num) - parteEntera) * 100)

  // Convertir parte entera a palabras
  const palabras = convertirNumeroCompleto(parteEntera)

  // Determinar moneda
  const monedaNombre = currency === 'USD' ? 'DÓLARES' : 'SOLES'

  // Formatear parte decimal con dos dígitos
  const centavos = parteDecimal.toString().padStart(2, '0')

  // Construir resultado final
  return `${palabras} CON ${centavos}/100 ${monedaNombre}`
}

/**
 * Versión corta para testing
 */
export function numberToWordsShort(amount: number | string): string {
  return numberToWords(amount, 'PEN')
}
