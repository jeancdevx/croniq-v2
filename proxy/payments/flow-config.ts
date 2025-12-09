export const getFlowConfig = () => {
  const env = process.env.FLOW_ENV || 'sandbox'
  const isProduction = env === 'production'

  if (isProduction) {
    const apiKey = process.env.FLOW_API_KEY_PRODUCTION
    const secretKey = process.env.FLOW_SECRET_KEY_PRODUCTION

    if (!apiKey || !secretKey) {
      throw new Error('Flow Production API Keys are missing in .env')
    }

    return {
      apiKey,
      secretKey,
      apiUrl: process.env.FLOW_API_URL_PRODUCTION || 'https://www.flow.cl/api',
      env: 'production'
    }
  }

  const apiKey = process.env.FLOW_API_KEY_SANDBOX
  const secretKey = process.env.FLOW_SECRET_KEY_SANDBOX

  if (!apiKey || !secretKey) {
    throw new Error('Flow Sandbox API Keys are missing in .env')
  }

  return {
    apiKey,
    secretKey,
    apiUrl: process.env.FLOW_API_URL_SANDBOX || 'https://sandbox.flow.cl/api',
    env: 'sandbox'
  }
}
