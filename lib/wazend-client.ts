type WazendConfig = {
  apiKey: string
  serverUrl: string
  instanceName: string
}

type SendTextParams = {
  number: string
  text: string
}

type SendMediaParams = {
  number: string
  mediatype: 'image' | 'document' | 'video' | 'audio'
  mimetype: string
  caption?: string
  media: string // URL or base64
  fileName: string
}

type WazendResponse = {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  pushName: string
  status: string
  message: unknown
  contextInfo: unknown
  messageType: string
  messageTimestamp: number
  instanceId: string
  source: string
}

export class WazendClient {
  private config: WazendConfig

  constructor(config: WazendConfig) {
    this.config = config
  }

  async sendTextMessage(params: SendTextParams): Promise<WazendResponse> {
    const url = `${this.config.serverUrl}/message/sendText/${this.config.instanceName}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apiKey: this.config.apiKey
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      let errorDetails = ''
      try {
        const errorBody = await response.text()
        errorDetails = ` - Details: ${errorBody}`
      } catch {
        // Ignore if body cannot be read
      }
      throw new Error(
        `Wazend API error: ${response.status} ${response.statusText}${errorDetails}`
      )
    }

    return response.json()
  }

  async sendDocument(params: SendMediaParams): Promise<WazendResponse> {
    const url = `${this.config.serverUrl}/message/sendMedia/${this.config.instanceName}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apiKey: this.config.apiKey
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      let errorDetails = ''
      try {
        const errorBody = await response.text()
        errorDetails = ` - Details: ${errorBody}`
      } catch {
        // Ignore if body cannot be read
      }
      throw new Error(
        `Wazend API error: ${response.status} ${response.statusText}${errorDetails}`
      )
    }

    return response.json()
  }
}

// Factory function to create client from environment variables
export function createWazendClient(): WazendClient {
  const apiKey = process.env.WAZEND_API_KEY
  const serverUrl = process.env.WAZEND_SERVER_URL
  const instanceName = process.env.WAZEND_INSTANCE_NAME

  if (!apiKey || !serverUrl || !instanceName) {
    throw new Error(
      'Missing Wazend configuration. Please set WAZEND_API_KEY, WAZEND_SERVER_URL, and WAZEND_INSTANCE_NAME environment variables.'
    )
  }

  return new WazendClient({
    apiKey,
    serverUrl,
    instanceName
  })
}
