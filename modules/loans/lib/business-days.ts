/**
 * Días feriados de Perú 2025-2027
 * Fuente: https://www.gob.pe/feriados
 */
const FERIADOS_PERU: string[] = [
  // 2025
  '2025-01-01', // Año Nuevo
  '2025-04-17', // Jueves Santo
  '2025-04-18', // Viernes Santo
  '2025-05-01', // Día del Trabajo
  '2025-06-29', // San Pedro y San Pablo
  '2025-07-28', // Fiestas Patrias
  '2025-07-29', // Fiestas Patrias
  '2025-08-30', // Santa Rosa de Lima
  '2025-10-08', // Combate de Angamos
  '2025-11-01', // Todos los Santos
  '2025-12-08', // Inmaculada Concepción
  '2025-12-25', // Navidad

  // 2026
  '2026-01-01', // Año Nuevo
  '2026-04-02', // Jueves Santo
  '2026-04-03', // Viernes Santo
  '2026-05-01', // Día del Trabajo
  '2026-06-29', // San Pedro y San Pablo
  '2026-07-28', // Fiestas Patrias
  '2026-07-29', // Fiestas Patrias
  '2026-08-30', // Santa Rosa de Lima
  '2026-10-08', // Combate de Angamos
  '2026-11-01', // Todos los Santos
  '2026-12-08', // Inmaculada Concepción
  '2026-12-25', // Navidad

  // 2027
  '2027-01-01', // Año Nuevo
  '2027-03-25', // Jueves Santo
  '2027-03-26', // Viernes Santo
  '2027-05-01', // Día del Trabajo
  '2027-06-29', // San Pedro y San Pablo
  '2027-07-28', // Fiestas Patrias
  '2027-07-29', // Fiestas Patrias
  '2027-08-30', // Santa Rosa de Lima
  '2027-10-08', // Combate de Angamos
  '2027-11-01', // Todos los Santos
  '2027-12-08', // Inmaculada Concepción
  '2027-12-25' // Navidad
]

/**
 * Verifica si una fecha es día hábil (lunes a viernes, no feriado)
 */
export const isBusinessDay = (date: Date): boolean => {
  const dayOfWeek = date.getDay()

  // 0 = Domingo, 6 = Sábado
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false
  }

  // Verificar si es feriado
  const dateStr = date.toISOString().split('T')[0]
  return !FERIADOS_PERU.includes(dateStr)
}

/**
 * Ajusta una fecha al siguiente día hábil si cae en fin de semana o feriado
 * Según práctica BBVA/SBS Perú
 */
export const adjustToNextBusinessDay = (date: Date): Date => {
  const adjusted = new Date(date)

  // Mientras no sea día hábil, avanzar un día
  while (!isBusinessDay(adjusted)) {
    adjusted.setDate(adjusted.getDate() + 1)
  }

  return adjusted
}

/**
 * Formatea una fecha a string YYYY-MM-DD
 */
export const formatDateISO = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
