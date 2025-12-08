import { redirect } from 'next/navigation'

import { auth } from '@clerk/nextjs/server'

import { ClientsView } from '@/modules/clients/ui/views'

export default async function ClientsPage() {
  const { isAuthenticated } = await auth()

  if (!isAuthenticated) redirect('/sign-in')

  return <ClientsView />
}
