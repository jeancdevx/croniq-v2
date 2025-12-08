export const capitalizeText = (text: string): string => {
  if (!text) return ''

  return text
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export const splitNombreCompleto = (
  nombreCompleto: string
): {
  apellidos: string
  nombres: string
} => {
  const [apellidosPart, nombresPart] = nombreCompleto
    .split(',')
    .map(s => s.trim())

  return {
    apellidos: capitalizeText(apellidosPart || ''),
    nombres: capitalizeText(nombresPart || '')
  }
}
