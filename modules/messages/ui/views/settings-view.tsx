'use client'

import { ReminderConfigCard } from '../components/reminder-config-card'

export function SettingsView() {
  return (
    <>
      {/* Header */}
      <div className='flex justify-between'>
        <div className='flex flex-col gap-y-1'>
          <h4 className='text-4xl font-bold'>Configuración</h4>
          <p className='text-muted-foreground'>
            Configura los parámetros de envío de mensajes
          </p>
        </div>
      </div>

      {/* Config Card */}
      <div className='mt-6'>
        <ReminderConfigCard />
      </div>

      {/* Footer */}
      <div className='text-muted-foreground mt-8 flex items-center justify-center gap-2 pb-8 text-sm'>
        <span>Powered by</span>
        <img src='/Logos-7.png' alt='Logo' className='h-6 w-auto' />
      </div>
    </>
  )
}
