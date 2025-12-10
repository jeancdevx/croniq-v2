'use client'

import { useEffect, useState } from 'react'

import { Loader2, Search } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Cliente } from '@/db/types'

import { createUserSchema } from '@/modules/clients/schemas'
import { createUser, searchDni, updateClient } from '@/modules/clients/server'
import { CreateUser } from '@/modules/clients/types'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Cliente | null
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client
}: ClientFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [dniFound, setDniFound] = useState(false)
  const isEdit = !!client

  const form = useForm<CreateUser>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      dni: '',
      nombres: '',
      apellidos: '',
      direccion: '',
      telefono: '',
      email: ''
    }
  })

  useEffect(() => {
    if (open) {
      if (client) {
        form.reset({
          dni: client.dni,
          nombres: client.nombres,
          apellidos: client.apellidos,
          direccion: client.direccion || '',
          telefono: client.telefono,
          email: client.email || ''
        })
        setDniFound(true) // Assume existing client data is valid
      } else {
        form.reset({
          dni: '',
          nombres: '',
          apellidos: '',
          direccion: '',
          telefono: '',
          email: ''
        })
        setDniFound(false)
      }
    }
  }, [open, client, form])

  const handleDniSearch = async () => {
    const dni = form.getValues('dni')

    if (!dni || dni.length !== 8) {
      toast.error('Error', {
        description: 'Debe ingresar un DNI válido de 8 dígitos'
      })
      return
    }

    setIsSearching(true)

    try {
      const result = await searchDni(dni)

      if (result.success) {
        form.setValue('nombres', result.data.nombres)
        form.setValue('apellidos', result.data.apellidos)
        form.setValue('direccion', result.data.direccion)

        setDniFound(true)

        toast.success('¡DNI encontrado!', {
          description: 'Datos cargados automáticamente desde RENIEC'
        })
      } else {
        setDniFound(false)
        toast.error('DNI no encontrado', {
          description: result.error
        })
      }
    } catch {
      toast.error('Error', {
        description:
          'Error al buscar el DNI. Puede ingresar los datos manualmente.'
      })
    } finally {
      setIsSearching(false)
    }
  }

  const onSubmit = async (data: CreateUser) => {
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('dni', data.dni)
      formData.append('nombres', data.nombres)
      formData.append('apellidos', data.apellidos)
      formData.append('direccion', data.direccion || '')
      formData.append('telefono', data.telefono)
      formData.append('email', data.email || '')

      let result
      if (isEdit && client) {
        result = await updateClient(client.id, formData)
      } else {
        result = await createUser(formData)
      }

      if (result.success) {
        toast.success('¡Éxito!', {
          description: result.message
        })
        if (!isEdit) {
          form.reset()
          setDniFound(false)
        }
        onOpenChange(false)
      } else {
        toast.error('Error', {
          description:
            result.error ||
            `Error al ${isEdit ? 'actualizar' : 'crear'} el cliente`
        })
      }
    } catch {
      toast.error('Error', {
        description: 'Ocurrió un error inesperado'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifique los datos del cliente.'
              : 'Ingrese el DNI para buscar los datos automáticamente o complete el formulario manualmente.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='dni'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI *</FormLabel>
                  <div className='flex gap-2'>
                    <FormControl>
                      <Input
                        type='password' // Keep password type for DNI as per original code, though usually text is fine.
                        placeholder='12345678'
                        disabled={isLoading || isSearching || isEdit} // Disable DNI editing in edit mode? Usually yes.
                        maxLength={8}
                        {...field}
                        onChange={e => {
                          const value = e.target.value.replace(/\D/g, '')
                          field.onChange(value)
                          if (!isEdit) setDniFound(false)
                        }}
                      />
                    </FormControl>
                    {!isEdit && (
                      <Button
                        type='button'
                        variant='secondary'
                        size='icon'
                        onClick={handleDniSearch}
                        disabled={
                          isLoading || isSearching || field.value.length !== 8
                        }
                      >
                        {isSearching ? (
                          <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                          <Search className='h-4 w-4' />
                        )}
                      </Button>
                    )}
                  </div>
                  {!isEdit && dniFound && (
                    <FormDescription className='text-green-600'>
                      ✓ Datos encontrados en RENIEC
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='nombres'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Se completará al buscar DNI'
                        disabled={!isEdit} // Disabled in create mode (relies on search), enabled in edit mode? Or always disabled?
                        // Original code had disabled={true}.
                        // If we want to allow editing typos, we should enable it.
                        // But if we want to enforce RENIEC data, we keep it disabled.
                        // For edit mode, maybe we allow editing.
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='apellidos'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Se completará al buscar DNI'
                        disabled={!isEdit}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='telefono'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='987654321'
                      disabled={isLoading}
                      maxLength={9}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='correo@ejemplo.com'
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='direccion'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Se completará al buscar DNI'
                      className='resize-none'
                      disabled={!isEdit} // Allow editing address in edit mode?
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  if (!isEdit) {
                    form.reset()
                    setDniFound(false)
                  }
                  onOpenChange(false)
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEdit ? 'Guardar Cambios' : 'Crear Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
