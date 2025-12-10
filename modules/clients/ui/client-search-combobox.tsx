'use client'

import { useCallback, useEffect, useState } from 'react'

import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react'

import type { Cliente } from '@/db/types'
import { cn } from '@/lib/utils'

import { searchClients } from '@/modules/clients/server/search-clients'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'

interface ClientSearchComboboxProps {
  value: string
  onSelect: (clientId: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ClientSearchCombobox({
  value,
  onSelect,
  disabled,
  placeholder = 'Buscar cliente por DNI o nombre...'
}: ClientSearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [clients, setClients] = useState<Cliente[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)

  // Load selected client data when value changes
  useEffect(() => {
    if (value && !selectedClient) {
      // If we have a value but no selected client, try to find it in current results
      const found = clients.find(c => c.id === value)
      if (found) {
        setSelectedClient(found)
      }
    }
  }, [value, selectedClient, clients])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        try {
          const results = await searchClients(searchQuery)
          setClients(results)
        } catch (error) {
          console.error('Error searching clients:', error)
          setClients([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setClients([])
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSelect = useCallback(
    (client: Cliente) => {
      onSelect(client.id)
      setSelectedClient(client)
      setOpen(false)
    },
    [onSelect]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          {selectedClient
            ? `${selectedClient.nombres} ${selectedClient.apellidos}`
            : placeholder}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[400px] p-0'>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Escribe DNI o nombre (mín. 2 caracteres)...'
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isSearching && (
              <div className='flex items-center justify-center p-4'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span className='text-muted-foreground ml-2 text-sm'>
                  Buscando...
                </span>
              </div>
            )}
            {!isSearching && searchQuery.length < 2 && (
              <CommandEmpty>
                <div className='flex flex-col items-center py-6'>
                  <Search className='text-muted-foreground h-8 w-8' />
                  <p className='text-muted-foreground mt-2 text-sm'>
                    Escribe al menos 2 caracteres para buscar
                  </p>
                </div>
              </CommandEmpty>
            )}
            {!isSearching &&
              searchQuery.length >= 2 &&
              clients.length === 0 && (
                <CommandEmpty>No se encontraron clientes.</CommandEmpty>
              )}
            {!isSearching && clients.length > 0 && (
              <CommandGroup>
                {clients.map(client => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => handleSelect(client)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === client.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {client.nombres} {client.apellidos}
                    <span className='text-muted-foreground ml-2 text-sm'>
                      (DNI: {client.dni})
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
