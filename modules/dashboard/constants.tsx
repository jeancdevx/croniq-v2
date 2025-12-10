import {
  Frame,
  Map,
  MessageSquareIcon,
  PieChart,
  PieChartIcon,
  SquareTerminal,
  Wallet2Icon,
  type LucideIcon
} from 'lucide-react'

type sidebarDataItems = {
  navMain: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items: {
      title: string
      url: string
    }[]
  }[]
  projects: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}

export const sidebarData: sidebarDataItems = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: 'Clientes',
          url: '/clients'
        }
      ]
    },
    {
      title: 'Préstamos',
      url: '/loans',
      icon: Wallet2Icon,
      items: [
        {
          title: 'Listado de Préstamos',
          url: '/loans'
        },
        {
          title: 'Nuevo Préstamo',
          url: '/loans/new'
        }
      ]
    },
    {
      title: 'Pagos',
      url: '/payments',
      icon: PieChartIcon,
      items: [
        {
          title: 'Listado de Pagos',
          url: '/payments'
        },
        {
          title: 'Registrar Pago',
          url: '/payments/new'
        },
        {
          title: 'Comprobantes',
          url: '/payments/receipts'
        }
      ]
    },
    {
      title: 'Caja',
      url: '/caja',
      icon: Wallet2Icon,
      items: [
        {
          title: 'Apertura / Cierre',
          url: '/caja'
        },
        {
          title: 'Historial',
          url: '/caja/historial'
        }
      ]
    },
    {
      title: 'Envío de Mensajes',
      url: '/messages',
      icon: MessageSquareIcon,
      items: [
        {
          title: 'Recordatorios',
          url: '/messages/reminders'
        },
        {
          title: 'Historial',
          url: '#'
        },
        {
          title: 'Configuración',
          url: '#'
        }
      ]
    }
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: Frame
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: PieChart
    },
    {
      name: 'Travel',
      url: '#',
      icon: Map
    }
  ]
}
