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
