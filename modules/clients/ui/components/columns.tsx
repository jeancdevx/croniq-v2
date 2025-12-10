'use client'

import { ColumnDef } from '@tanstack/react-table'

import { Cliente } from '@/db/types'

import { Checkbox } from '@/components/ui/checkbox'

import { ClientActions } from './client-actions'
import { DataTableColumnHeader } from './data-table-column-header'

export const columns: ColumnDef<Cliente>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Seleccionar todo'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label='Seleccionar fila'
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'dni',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title='DNI' />
    },
    cell: () => {
      return <div>********</div>
    }
  },
  {
    accessorKey: 'nombres',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title='Nombres' />
    },
    cell: ({ row }) => {
      return (
        <div>
          {row.getValue('nombres')} {row.original.apellidos}
        </div>
      )
    }
  },
  {
    accessorKey: 'telefono',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title='Teléfono' />
    }
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title='Email' />
    },
    cell: ({ row }) => {
      const email = row.getValue('email') as string | null
      return <div>{email || '-'}</div>
    }
  },
  {
    accessorKey: 'direccion',
    header: 'Dirección',
    cell: ({ row }) => {
      const direccion = row.getValue('direccion') as string | null
      return <div className='max-w-[200px] truncate'>{direccion || '-'}</div>
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <ClientActions client={row.original} />
  }
]
