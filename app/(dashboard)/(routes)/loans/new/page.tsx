import { redirect } from 'next/navigation'

import { auth } from '@clerk/nextjs/server'

import { NewLoanView } from '@/modules/loans/ui/views'

export default async function NewLoanPage() {
  const { isAuthenticated } = await auth()

  if (!isAuthenticated) redirect('/sign-in')

  return <NewLoanView />
}
