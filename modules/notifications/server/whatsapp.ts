export async function sendWhatsappMessage(phone: string, message: string) {
  const serverUrl = process.env.WAZEND_SERVER_URL
  const instanceName = process.env.WAZEND_INSTANCE_NAME
  const apiKey = process.env.WAZEND_API_KEY

  if (!serverUrl || !instanceName || !apiKey) {
    console.error('Missing WAZEND configuration')
    return { success: false, error: 'Configuration missing' }
  }

  try {
    // Ensure phone has country code. Assuming Peru (51) if missing
    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.length === 9) {
      formattedPhone = '51' + formattedPhone
    }

    const url = `${serverUrl}/message/sendText/${instanceName}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
        delay: 1200,
        linkPreview: true
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Wazend API Error:', data)
      return { success: false, error: data.message || 'Error sending message' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return { success: false, error: 'Internal server error' }
  }
}
