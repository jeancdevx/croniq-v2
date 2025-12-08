'use client'

import { useState } from 'react'

import { MessageCircle, Phone, Send } from 'lucide-react'

import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

import { debtorToDebtorInfo } from '../../lib/debtor-mapper'
import type { Debtor } from '../../types'

// Función para enviar mensaje individual
async function sendWhatsAppMessage(debtor: Debtor) {
  try {
    const response = await fetch('/api/whatsapp/send-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        debtor: debtorToDebtorInfo(debtor)
      })
    })

    const data = await response.json()

    if (response.ok) {
      toast.success('Mensaje enviado', {
        description: `Recordatorio enviado a ${debtor.nombre}`
      })
    } else {
      throw new Error(data.error || 'Error al enviar mensaje')
    }
  } catch (error) {
    toast.error('Error', {
      description:
        error instanceof Error ? error.message : 'Error al enviar mensaje'
    })
  }
}

// Componente para la celda de acciones
function ActionCell({ debtor }: { debtor: Debtor }) {
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    setSending(true)
    await sendWhatsAppMessage(debtor)
    setSending(false)
  }

  return (
    <Button size='sm' onClick={handleSend} disabled={sending} className='gap-2'>
      {sending ? (
        <>
          <MessageCircle className='h-4 w-4 animate-pulse' />
          Enviando...
        </>
      ) : (
        <>
          <Send className='h-4 w-4' />
          WhatsApp
        </>
      )}
    </Button>
  )
}

export const columns: ColumnDef<Debtor>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Seleccionar todos'
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
    accessorKey: 'nombre',
    header: 'Nombre',
    cell: ({ row }) => (
      <div className='font-medium'>{row.getValue('nombre')}</div>
    )
  },
  {
    accessorKey: 'dni',
    header: 'DNI',
    cell: ({ row }) => {
      const dni = row.getValue('dni') as string
      return <div className='font-mono text-sm'>{'*'.repeat(dni.length)}</div>
    }
  },
  {
    accessorKey: 'telefono',
    header: 'Teléfono',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <Phone className='text-muted-foreground h-4 w-4' />
        <span className='font-mono text-sm'>{row.getValue('telefono')}</span>
      </div>
    )
  },
  {
    accessorKey: 'deuda',
    header: 'Deuda',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('deuda'))
      const formatted = new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
      }).format(amount)

      return <div className='font-medium'>{formatted}</div>
    }
  },
  {
    accessorKey: 'vencimiento',
    header: 'Vencimiento',
    cell: ({ row }) => (
      <div className='text-sm'>{row.getValue('vencimiento')}</div>
    )
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.getValue('estado') as Debtor['estado']

      const variants = {
        vencido: { variant: 'destructive' as const, label: 'Vencido' },
        vence_hoy: { variant: 'default' as const, label: 'Vence Hoy' },
        proximo: { variant: 'secondary' as const, label: 'Próximo' }
      }

      const { variant, label } = variants[estado]

      return <Badge variant={variant}>{label}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    }
  },
  {
    accessorKey: 'diasRestantes',
    header: 'Días',
    cell: ({ row }) => {
      const dias = row.getValue('diasRestantes') as number
      const color =
        dias < 0
          ? 'text-destructive'
          : dias === 0
            ? 'text-yellow-600'
            : 'text-muted-foreground'

      return (
        <div className={`text-sm font-medium ${color}`}>
          {dias < 0
            ? `${Math.abs(dias)} días vencido`
            : dias === 0
              ? 'Hoy'
              : `${dias} días`}
        </div>
      )
    }
  },
  {
    id: 'actions',
    header: 'Acción',
    cell: ({ row }) => <ActionCell debtor={row.original} />
  }
]
