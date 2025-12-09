import { getLoans } from '../../data/get-loans'
import { columns } from '../components/columns'
import { DataTable } from '../components/data-table'

const LoansListView = async () => {
  const loans = await getLoans()

  return (
    <div className='flex flex-col gap-4'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Préstamos</h2>
        <p className='text-muted-foreground'>
          Lista completa de préstamos registrados en el sistema
        </p>
      </div>

      <DataTable columns={columns} data={loans} />
    </div>
  )
}

export { LoansListView }
