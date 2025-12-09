'use client'

import { FileText } from 'lucide-react'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

interface DownloadScheduleButtonProps {
  loanId: string | null | undefined
}

export function DownloadScheduleButton({
  loanId
}: DownloadScheduleButtonProps) {
  const handleDownload = () => {
    if (!loanId) {
      toast.error('No hay información del préstamo disponible')
      return
    }

    // Open the PDF generation route in a new tab
    window.open(`/payment/schedule/${loanId}/pdf`, '_blank')
    toast.success('Descargando cronograma...')
  }

  return (
    <Button
      className='w-full gap-2'
      variant='outline'
      onClick={handleDownload}
      disabled={!loanId}
    >
      <FileText className='h-4 w-4' />
      Descargar Cronograma
    </Button>
  )
}
