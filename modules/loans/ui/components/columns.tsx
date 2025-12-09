'use client'

import Link from 'next/link'

import { MoreHorizontal } from 'lucide-react'

import { ColumnDef } from '@tanstack/react-table'
import { format, parseISO } from 'date-fns'

import type { PrestamoConCuotas } from '@/db/types'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import { DataTableColumnHeader } from './data-table-column-header'
import { DeleteDraftButton } from './delete-draft-button'
import { SendScheduleButton } from './send-schedule-button'

export const columns: ColumnDef<PrestamoConCuotas>[] = [
  {
    accessorKey: 'cliente',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Cliente' />
    ),
    cell: ({ row }) => {
      const cliente = row.original.cliente
      return (
        <div>{cliente ? `${cliente.nombres} ${cliente.apellidos}` : '-'}</div>
      )
    }
  },
  {
    accessorKey: 'montoSolicitado',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Monto' />
    ),
    cell: ({ row }) => {
      const monto = parseFloat(row.getValue('montoSolicitado'))
      const moneda = row.original.monedaPrestamo || 'PEN'

      const locale = moneda === 'USD' ? 'en-US' : 'es-PE'

      const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: moneda
      }).format(monto)
      return <div className='font-medium'>{formatted}</div>
    }
  },
  {
    accessorKey: 'numeroCuotas',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Cuotas' />
    ),
    cell: ({ row }) => {
      return <div>{row.getValue('numeroCuotas')} meses</div>
    }
  },
  {
    accessorKey: 'tea',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='TEA' />
    ),
    cell: ({ row }) => {
      const tea = parseFloat(row.getValue('tea'))
      return <div>{(tea * 100).toFixed(2)}%</div>
    }
  },
  {
    accessorKey: 'tcea',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='TCEA' />
    ),
    cell: ({ row }) => {
      const tcea = parseFloat(row.getValue('tcea'))
      return <div>{(tcea * 100).toFixed(2)}%</div>
    }
  },
  {
    accessorKey: 'fechaDesembolso',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Fecha Desembolso' />
    ),
    cell: ({ row }) => {
      const fecha = row.getValue('fechaDesembolso') as string
      return <div>{format(parseISO(fecha), 'dd/MM/yyyy')}</div>
    }
  },
  {
    accessorKey: 'estado',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Estado' />
    ),
    cell: ({ row }) => {
      const estado = row.getValue('estado') as string
      const colorClass =
        estado === 'ACTIVO'
          ? 'bg-green-100 text-green-800'
          : estado === 'FINALIZADO'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'

      return (
        <div
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${colorClass}`}
        >
          {estado}
        </div>
      )
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const loan = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Abrir menú</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/loans/${loan.id}`}>Ver detalles</Link>
            </DropdownMenuItem>
            {loan.estado === 'DRAFT' && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/loans/${loan.id}/edit`}>Editar préstamo</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/loans/${loan.id}`}>Confirmar préstamo</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DeleteDraftButton loanId={loan.id} />
              </>
            )}
            {loan.estado !== 'DRAFT' && (
              <>
                <SendScheduleButton loanId={loan.id} />
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(loan.id)}
            >
              Copiar ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]
