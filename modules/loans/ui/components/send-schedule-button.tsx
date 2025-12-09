'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { toast } from 'sonner'

import { sendScheduleWhatsApp } from '@/modules/loans/server'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

interface SendScheduleButtonProps {
  loanId: string
}

export function SendScheduleButton({ loanId }: SendScheduleButtonProps) {
  const router = useRouter()
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    setIsSending(true)

    try {
      const result = await sendScheduleWhatsApp(loanId)

      if (result.success) {
        toast.success('Cronograma enviado', {
          description: 'El cronograma ha sido enviado por WhatsApp'
        })
      } else {
        toast.error('Error', {
          description: result.error
        })
      }
    } catch {
      toast.error('Error', {
        description: 'Ocurrió un error inesperado'
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <DropdownMenuItem onClick={handleSend} disabled={isSending}>
      {isSending ? 'Enviando...' : 'Enviar cronograma'}
    </DropdownMenuItem>
  )
}
