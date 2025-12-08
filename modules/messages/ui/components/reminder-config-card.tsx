'use client'

import { useState } from 'react'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PRESET_DAYS = [3, 5, 7, 10, 15]

interface ReminderConfigCardProps {
  onConfigSave?: (days: number[]) => void
}

export function ReminderConfigCard({ onConfigSave }: ReminderConfigCardProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([3, 5])
  const [customDays, setCustomDays] = useState<string>('')

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    )
  }

  const handleSaveConfig = () => {
    const allDays = [...selectedDays]

    if (customDays) {
      const custom = parseInt(customDays)
      if (!isNaN(custom) && custom > 0 && !allDays.includes(custom)) {
        allDays.push(custom)
        allDays.sort((a, b) => a - b)
      }
    }

    onConfigSave?.(allDays)

    toast.success('Configuración guardada', {
      description: `Recordatorios configurados para: ${allDays.join(', ')} días de anticipación`
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Recordatorios</CardTitle>
        <CardDescription>
          Selecciona los días de anticipación para enviar recordatorios
          automáticos
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-3'>
          <Label>Días de anticipación</Label>
          <div className='flex flex-wrap gap-4'>
            {PRESET_DAYS.map(day => (
              <div key={day} className='flex items-center space-x-2'>
                <Checkbox
                  id={`day-${day}`}
                  checked={selectedDays.includes(day)}
                  onCheckedChange={() => toggleDay(day)}
                />
                <label
                  htmlFor={`day-${day}`}
                  className='cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                >
                  {day} días
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='custom-days'>Días personalizados</Label>
          <div className='flex gap-2'>
            <Input
              id='custom-days'
              type='number'
              placeholder='Ej: 20'
              value={customDays}
              onChange={e => setCustomDays(e.target.value)}
              min='1'
              max='365'
            />
            <Button onClick={handleSaveConfig}>Guardar Configuración</Button>
          </div>
        </div>

        {selectedDays.length > 0 && (
          <div className='text-muted-foreground text-sm'>
            Recordatorios activos: {selectedDays.join(', ')} días antes del
            vencimiento
          </div>
        )}
      </CardContent>
    </Card>
  )
}
