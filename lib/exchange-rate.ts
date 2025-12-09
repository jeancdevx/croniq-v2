export interface ExchangeRateResponse {
  status: number
  message: string
  success: boolean
  data: {
    fecha: string
    compra: number
    venta: number
  }
}

export interface ExchangeRateResult {
  success: true
  data: {
    fecha: string
    compra: number
    venta: number
  }
}

export interface ExchangeRateError {
  success: false
  error: string
}

export type ExchangeRateData = ExchangeRateResult | ExchangeRateError

export async function getExchangeRate(
  fecha: string
): Promise<ExchangeRateData> {
  try {
    const apiUrl = process.env.FACTILIZA_TIPOCAMBIO_API_URL
    const bearerToken = process.env.FACTILIZA_BEARER_TOKEN

    if (!apiUrl || !bearerToken) {
      console.error('Missing exchange rate API configuration')
      console.error('API URL:', apiUrl)
      console.error('Bearer Token exists:', !!bearerToken)
      return {
        success: false,
        error: 'Configuración de API no disponible'
      }
    }

    const url = `${apiUrl}?fecha=${fecha}`
    console.log('Fetching exchange rate from:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    console.log('Exchange rate API status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Exchange rate API error:', response.status, errorText)
      return {
        success: false,
        error: `Error al consultar el tipo de cambio (${response.status})`
      }
    }

    const data: ExchangeRateResponse = await response.json()
    console.log('Exchange rate API response:', data)

    if (!data.success) {
      console.error('Exchange rate API returned success=false:', data.message)
      return {
        success: false,
        error: data.message || 'No se pudo obtener el tipo de cambio'
      }
    }

    // Aplicar margen del 2% al tipo de cambio de venta
    const ventaConMargen = data.data.venta * (1 + EXCHANGE_RATE_MARGIN)

    return {
      success: true,
      data: {
        fecha: data.data.fecha,
        compra: data.data.compra,
        venta: ventaConMargen // Ya incluye el 2% de margen
      }
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return {
      success: false,
      error: 'Error de conexión al servicio de tipo de cambio'
    }
  }
}

export async function getTodayExchangeRate(): Promise<ExchangeRateData> {
  const today = new Date().toISOString().split('T')[0]
  return getExchangeRate(today)
}

const EXCHANGE_RATE_MARGIN = 0.02

export function convertPENtoUSD(
  montoPEN: number,
  tipoCambioCompra: number,
  margen: number = EXCHANGE_RATE_MARGIN
): number {
  const tcConMargen = tipoCambioCompra * (1 - margen)
  return montoPEN / tcConMargen
}

export function convertUSDtoPEN(
  montoUSD: number,
  tipoCambioVenta: number,
  margen: number = EXCHANGE_RATE_MARGIN
): number {
  const tcConMargen = tipoCambioVenta * (1 + margen)
  return montoUSD * tcConMargen
}
