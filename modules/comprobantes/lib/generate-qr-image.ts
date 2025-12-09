import QRCode from 'qrcode'

/**
 * Genera un código QR como imagen base64 para usar en PDFs
 * @param data - Datos a codificar en el QR
 * @returns Promise con la imagen en formato data URL (base64)
 */
export async function generateQRImage(data: string): Promise<string> {
  try {
    // Generar QR como data URL (base64)
    const qrDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return qrDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}
