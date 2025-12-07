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
      title: 'Prestamos',
      url: '/prestamos',
      icon: Wallet2Icon,
      items: [
        {
          title: 'Listado de Préstamos',
          url: '/prestamos'
        },
        {
          title: 'Registrar Préstamo',
          url: '/prestamos/registrar'
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
