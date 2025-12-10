'use client'

import { Download } from 'lucide-react'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

interface DownloadReceiptButtonProps {
  paymentId: string
}

export function DownloadReceiptButton({
  paymentId
}: DownloadReceiptButtonProps) {
  const handleDownload = () => {
    if (!paymentId) {
      toast.error('No hay información del pago disponible')
      return
    }

    // Open the PDF generation route in a new tab
    window.open(`/payment/receipt/${paymentId}/pdf`, '_blank')
    toast.success('Descargando comprobante...')
  }

  return (
    <Button className='w-full gap-2' variant='outline' onClick={handleDownload}>
      <Download className='h-4 w-4' />
      Descargar Comprobante
    </Button>
  )
}
