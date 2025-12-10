'use client'

import { ArrowUpDown } from 'lucide-react'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { DataTable } from '../components/data-table'

// Tipo temporal para el historial
type MessageHistoryItem = {
  id: string
  fecha: Date
  destinatario: string
  telefono: string
  tipo: 'RECORDATORIO' | 'COMPROBANTE' | 'CRONOGRAMA'
  estado: 'ENVIADO' | 'FALLIDO'
}

// Datos de ejemplo (puedes reemplazarlos con una llamada a API real luego)
const mockData: MessageHistoryItem[] = [
  // {
  //   id: '1',
  //   fecha: new Date(),
  //   destinatario: 'Juan Pérez',
  //   telefono: '51987654321',
  //   tipo: 'RECORDATORIO',
  //   estado: 'ENVIADO'
  // }
]

const columns: ColumnDef<MessageHistoryItem>[] = [
  {
    accessorKey: 'fecha',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Fecha
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) =>
      format(row.getValue('fecha'), 'dd/MM/yyyy HH:mm', { locale: es })
  },
  {
    accessorKey: 'destinatario',
    header: 'Destinatario'
  },
  {
    accessorKey: 'telefono',
    header: 'Teléfono'
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => <Badge variant='outline'>{row.getValue('tipo')}</Badge>
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.getValue('estado') as string
      return (
        <Badge variant={estado === 'ENVIADO' ? 'default' : 'destructive'}>
          {estado}
        </Badge>
      )
    }
  }
]

export function HistoryView() {
  return (
    <>
      {/* Header */}
      <div className='flex justify-between'>
        <div className='flex flex-col gap-y-1'>
          <h4 className='text-4xl font-bold'>Historial de Mensajes</h4>
          <p className='text-muted-foreground'>
            Registro de mensajes enviados por el sistema
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className='container mx-auto py-4'>
        <DataTable columns={columns} data={mockData} />
      </div>

      {/* Footer */}
      <div className='text-muted-foreground mt-8 flex items-center justify-center gap-2 pb-8 text-sm'>
        <span>Powered by</span>
        <img src='/Logos-7.png' alt='Logo' className='h-6 w-auto' />
      </div>
    </>
  )
}
