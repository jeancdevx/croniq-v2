'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import type { ReminderConfig } from '@/types/reminder'

interface ReminderConfigProps {
    config: ReminderConfig
    onChange: (config: ReminderConfig) => void
}

const PRESET_DAYS = [3, 5, 7]

export function ReminderConfigPanel({
    config,
    onChange
}: ReminderConfigProps) {
    const [customInput, setCustomInput] = useState<string>(
        config.customDays?.toString() || ''
    )

    const togglePresetDay = (day: number) => {
        const newSelectedDays = config.selectedDays.includes(day)
            ? config.selectedDays.filter(d => d !== day)
            : [...config.selectedDays, day].sort((a, b) => a - b)

        onChange({
            ...config,
            selectedDays: newSelectedDays
        })
    }

    const handleCustomDaysChange = (value: string) => {
        setCustomInput(value)

        if (value === '') {
            onChange({
                ...config,
                customDays: null,
                selectedDays: config.selectedDays.filter(d =>
                    PRESET_DAYS.includes(d)
                )
            })
            return
        }

        const numValue = parseInt(value, 10)
        if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
            // Remove old custom day and add new one
            const newSelectedDays = [
                ...config.selectedDays.filter(d => PRESET_DAYS.includes(d)),
                numValue
            ].sort((a, b) => a - b)

            onChange({
                ...config,
                customDays: numValue,
                selectedDays: newSelectedDays
            })
        }
    }

    return (
        <Card className="border-green-200 bg-white">
            <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-white">
                <CardTitle className="text-green-800">
                    Configuración de Recordatorios
                </CardTitle>
                <CardDescription className="text-green-600">
                    Selecciona los días de anticipación para enviar recordatorios
                    de pago
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-6">
                    {/* Preset Days */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-green-800">
                            Días predefinidos
                        </Label>
                        <div className="flex flex-wrap gap-4">
                            {PRESET_DAYS.map(day => (
                                <div
                                    key={day}
                                    className="flex items-center space-x-2"
                                >
                                    <Checkbox
                                        id={`day-${day}`}
                                        checked={config.selectedDays.includes(day)}
                                        onCheckedChange={() => togglePresetDay(day)}
                                        className="border-green-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                    />
                                    <Label
                                        htmlFor={`day-${day}`}
                                        className="cursor-pointer text-sm font-medium text-gray-700"
                                    >
                                        {day} {day === 1 ? 'día' : 'días'} antes
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Custom Days */}
                    <div className="space-y-3">
                        <Label
                            htmlFor="custom-days"
                            className="text-sm font-semibold text-green-800"
                        >
                            Días personalizados (1-20)
                        </Label>
                        <div className="flex items-center gap-3">
                            <Input
                                id="custom-days"
                                type="number"
                                min="1"
                                max="20"
                                value={customInput}
                                onChange={e => handleCustomDaysChange(e.target.value)}
                                placeholder="Ej: 10"
                                className="max-w-[150px] border-green-300 focus:border-green-500 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-600">
                                días antes
                            </span>
                        </div>
                        {customInput &&
                            (parseInt(customInput, 10) < 1 ||
                                parseInt(customInput, 10) > 20) && (
                                <p className="text-sm text-red-600">
                                    Por favor ingresa un valor entre 1 y 20
                                </p>
                            )}
                    </div>

                    {/* Selected Days Summary */}
                    {config.selectedDays.length > 0 && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                            <p className="text-sm font-medium text-green-800">
                                Días seleccionados:
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {config.selectedDays.map(day => (
                                    <span
                                        key={day}
                                        className="inline-flex items-center rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white"
                                    >
                                        {day} {day === 1 ? 'día' : 'días'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
