import { getData } from '@/modules/clients/data'
import { columns } from '@/modules/clients/ui/components/columns'
import { DataTable } from '@/modules/clients/ui/components/data-table'

const ClientsView = async () => {
  const data = await getData()

  return (
    <>
      <div className='flex justify-between'>
        <div className='flex flex-col gap-y-1'>
          <h4 className='text-4xl font-bold'>Clientes</h4>
          <p className='text-muted-foreground'>
            Lista de clientes registrados en la plataforma
          </p>
        </div>
      </div>

      <div className='container mx-auto py-4'>
        <DataTable columns={columns} data={data} />
      </div>
    </>
  )
}

export { ClientsView }
