'use client'

import { usePathname } from 'next/navigation'

// Mapeo de rutas a breadcrumbs legibles
const routeToBreadcrumbs: Record<string, { category: string; page: string }> = {
  '/': {
    category: 'Dashboard',
    page: 'Inicio'
  },
  '/messages/reminders': {
    category: 'Envío de Mensajes',
    page: 'Recordatorios'
  },
  '/messages/history': {
    category: 'Envío de Mensajes',
    page: 'Historial'
  },
  '/messages/settings': {
    category: 'Envío de Mensajes',
    page: 'Configuración'
  }
}

export function useBreadcrumbs() {
  const pathname = usePathname()

  // Obtener breadcrumbs del mapeo o generar por defecto
  const breadcrumbs = routeToBreadcrumbs[pathname] || {
    category: 'Dashboard',
    page: pathname.split('/').pop() || 'Página'
  }

  return breadcrumbs
}
