import { Suspense } from 'react'

import { CheckCircle, XCircle } from 'lucide-react'

import { getPaymentByToken } from '@/proxy/payments/actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { DownloadReceiptButton } from '@/modules/payments/ui/components/download-receipt-button'
import { DownloadScheduleButton } from '@/modules/payments/ui/components/download-schedule-button'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface PaymentSuccessPageProps {
  searchParams: Promise<{ token?: string }>
}

async function PaymentDetails({ token }: { token?: string }) {
  if (!token) {
    return (
      <div className='flex flex-col items-center gap-4 text-center'>
        <XCircle className='h-16 w-16 text-red-500' />
        <h2 className='text-xl font-semibold'>Token no válido</h2>
        <p className='text-muted-foreground'>
          No se ha proporcionado un token de pago válido.
        </p>
      </div>
    )
  }

  const payment = await getPaymentByToken(token)

  if (!payment) {
    return (
      <div className='flex flex-col items-center gap-4 text-center'>
        <XCircle className='h-16 w-16 text-red-500' />
        <h2 className='text-xl font-semibold'>Pago no encontrado</h2>
        <p className='text-muted-foreground'>
          No pudimos encontrar la información del pago.
        </p>
      </div>
    )
  }

  const isSuccess =
    payment.estado === 'PAGADO' || payment.estado === 'PENDIENTE' // Flow returns 'PENDIENTE' initially sometimes before webhook confirms

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col items-center gap-2 text-center'>
        {isSuccess ? (
          <CheckCircle className='h-16 w-16 text-green-500' />
        ) : (
          <XCircle className='h-16 w-16 text-red-500' />
        )}
        <h2 className='text-2xl font-bold'>
          {isSuccess ? '¡Pago Exitoso!' : 'Pago no completado'}
        </h2>
        <p className='text-muted-foreground'>
          {isSuccess
            ? 'Su transacción ha sido procesada correctamente.'
            : 'Hubo un problema con su transacción.'}
        </p>
      </div>

      <Separator />

      <div className='grid gap-4 text-sm'>
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>ID de Referencia</span>
          <span className='font-mono font-medium'>{payment.flowOrder}</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Fecha</span>
          <span className='font-medium'>
            {format(
              payment.fechaCreacion || new Date(),
              'dd MMMM yyyy, HH:mm',
              {
                locale: es
              }
            )}
          </span>
        </div>
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Concepto</span>
          <span className='text-right font-medium'>{payment.concepto}</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Estado</span>
          <span
            className={`font-medium ${
              payment.estado === 'PAGADO'
                ? 'text-green-600'
                : payment.estado === 'PENDIENTE'
                  ? 'text-amber-600'
                  : 'text-red-600'
            }`}
          >
            {payment.estado}
          </span>
        </div>
        <Separator />
        <div className='flex justify-between text-lg font-bold'>
          <span>Total Pagado</span>
          <span>S/ {Number(payment.monto).toFixed(2)}</span>
        </div>
      </div>

      {isSuccess && (
        <div className='flex flex-col gap-3'>
          <DownloadReceiptButton paymentId={payment.id} />
        </div>
      )}
    </div>
  )
}

export default async function PaymentSuccessPage({
  searchParams
}: PaymentSuccessPageProps) {
  const { token } = await searchParams

  return (
    <div className='bg-muted/30 flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-md shadow-lg'>
        <CardHeader>
          <CardTitle className='text-center text-xl'>
            Detalle del Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className='flex flex-col items-center gap-4 py-8'>
                <div className='border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent'></div>
                <p className='text-muted-foreground'>Cargando detalles...</p>
              </div>
            }
          >
            <PaymentDetails token={token} />
          </Suspense>
        </CardContent>
        <CardFooter className='text-muted-foreground flex justify-center pb-6 text-xs'>
          <p>© 2025 Croniq. Todos los derechos reservados.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
