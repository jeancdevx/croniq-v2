import { redirect } from 'next/navigation'

import { auth } from '@clerk/nextjs/server'

import { LoansListView } from '@/modules/loans/ui/views'

export default async function LoansPage() {
  const { isAuthenticated } = await auth()

  if (!isAuthenticated) redirect('/sign-in')

  return <LoansListView />
}
