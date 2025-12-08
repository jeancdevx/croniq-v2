'use client'

import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function DownloadReceiptButton() {
  return (
    <Button
      className='w-full gap-2'
      variant='outline'
      onClick={() => window.print()}
    >
      <Download className='h-4 w-4' />
      Descargar / Imprimir Comprobante
    </Button>
  )
}
