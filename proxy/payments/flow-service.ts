import crypto from 'node:crypto'

import { getFlowConfig } from './flow-config'

export const signParams = (params: Record<string, string | number>) => {
  const { secretKey } = getFlowConfig()

  // 1. Sort keys alphabetically
  const sortedKeys = Object.keys(params).sort()

  // 2. Concatenate key=value
  const toSign = sortedKeys.map(key => `${key}=${params[key]}`).join('&')

  // 3. HMAC-SHA256
  const hmac = crypto.createHmac('sha256', secretKey)
  hmac.update(toSign)
  return hmac.digest('hex')
}

export const createFlowOrder = async (orderData: {
  commerceOrder: string
  subject: string
  currency?: string
  amount: number
  email: string
  urlConfirmation: string
  urlReturn: string
  optional?: string
}) => {
  const { apiKey, apiUrl } = getFlowConfig()

  const params: Record<string, string | number> = {
    apiKey,
    commerceOrder: orderData.commerceOrder,
    subject: orderData.subject,
    currency: orderData.currency || 'PEN', // Flow defaults.
    amount: orderData.amount,
    email: orderData.email,
    paymentMethod: 9, // 9 = All methods
    urlConfirmation: orderData.urlConfirmation,
    urlReturn: orderData.urlReturn
  }

  if (orderData.optional) {
    params.optional = orderData.optional
  }

  // Generate signature
  const s = signParams(params)

  // Append signature
  const body = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    body.append(key, String(value))
  })
  body.append('s', s)

  try {
    const response = await fetch(`${apiUrl}/payment/create`, {
      method: 'POST',
      body: body
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error creating Flow order')
    }

    return data // Returns { url, token, flowOrder }
  } catch (error) {
    console.error('Flow API Error:', error)
    throw error
  }
}

export const getFlowOrderStatus = async (token: string) => {
  const { apiKey, apiUrl } = getFlowConfig()

  const params = {
    apiKey,
    token
  }

  const s = signParams(params)
  const url = `${apiUrl}/payment/getStatus?apiKey=${apiKey}&token=${token}&s=${s}`

  const response = await fetch(url)
  const data = await response.json()

  return data
}

export const getPaymentMethodName = (mediaId: string | number): string => {
  const mediaMap: Record<string, string> = {
    '1': 'Tarjeta (Webpay)',
    '2': 'Servipag',
    '3': 'Multicaja',
    '4': 'OnePay',
    '5': 'CryptoCompra',
    '9': 'Saldo Flow',
    '10': 'Mach',
    '11': 'Khipu',
    '12': 'Chek',
    '13': 'Fpay',
    '20': 'Redcompra',
    '101': 'Webpay Plus',
    // Peru specific might vary, but adding common ones or generic fallback
    yape: 'Yape',
    pagoefectivo: 'PagoEfectivo'
  }

  // If it's already a name like "Yape" or "PagoEfectivo", return it formatted
  const idStr = String(mediaId).toLowerCase()
  if (idStr.includes('yape')) return 'Yape'
  if (idStr.includes('pago') && idStr.includes('efectivo'))
    return 'PagoEfectivo'
  if (
    idStr.includes('tarjeta') ||
    idStr.includes('card') ||
    idStr.includes('webpay')
  )
    return 'Tarjeta'

  // If it's a known ID, return the mapped name
  if (mediaMap[String(mediaId)]) {
    return mediaMap[String(mediaId)]
  }

  // If it's not an ID (likely a name string from Flow), return it as is (capitalized properly if possible)
  if (isNaN(Number(mediaId))) {
    return String(mediaId)
  }

  return `Flow (${mediaId})`
}
