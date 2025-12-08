'use client'

import { useState } from 'react'

import { Send, Settings2 } from 'lucide-react'

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState
} from '@tanstack/react-table'
import { toast } from 'sonner'

import { DataTablePagination } from '@/modules/clients/ui/components/data-table-pagination'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

import { debtorToDebtorInfo } from '../../lib/debtor-mapper'
import type { Debtor } from '../../types'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [sendingAll, setSendingAll] = useState(false)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination
    }
  })

  const handleSendToAll = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows

    if (selectedRows.length === 0) {
      toast.error('Error', {
        description: 'Selecciona al menos un cliente para enviar'
      })
      return
    }

    setSendingAll(true)

    try {
      const response = await fetch('/api/whatsapp/send-bulk-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtors: selectedRows.map(row =>
            debtorToDebtorInfo(row.original as Debtor)
          )
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Mensajes enviados', {
          description: `${selectedRows.length} recordatorios enviados exitosamente`
        })
        table.resetRowSelection()
      } else {
        throw new Error(data.error || 'Error al enviar mensajes')
      }
    } catch (error) {
      toast.error('Error', {
        description:
          error instanceof Error ? error.message : 'Error al enviar mensajes'
      })
    } finally {
      setSendingAll(false)
    }
  }

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div>
      <div className='flex items-center justify-between py-4'>
        <div className='flex items-center gap-4'>
          <Input
            placeholder='Buscar por nombre...'
            value={
              (table.getColumn('nombre')?.getFilterValue() as string) ?? ''
            }
            onChange={event =>
              table.getColumn('nombre')?.setFilterValue(event.target.value)
            }
            className='max-w-sm lg:w-[300px]'
          />

          <Select
            value={
              (table.getColumn('estado')?.getFilterValue() as string) ?? 'all'
            }
            onValueChange={value =>
              table
                .getColumn('estado')
                ?.setFilterValue(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filtrar por estado' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos</SelectItem>
              <SelectItem value='vencido'>Vencidos</SelectItem>
              <SelectItem value='vence_hoy'>Vencen Hoy</SelectItem>
              <SelectItem value='proximo'>Próximos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center gap-4'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='hidden h-8 lg:flex'
              >
                <Settings2 className='h-4 w-4' />
                Vista
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Alternar Columnas</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {table
                .getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className='capitalize'
                      checked={column.getIsVisible()}
                      onCheckedChange={value =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedCount > 0 && (
            <Button
              size='sm'
              onClick={handleSendToAll}
              disabled={sendingAll}
              className='gap-2'
            >
              <Send className='h-4 w-4' />
              {sendingAll ? 'Enviando...' : `Enviar a ${selectedCount}`}
            </Button>
          )}
        </div>
      </div>

      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-end space-x-2 py-4'>
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}
