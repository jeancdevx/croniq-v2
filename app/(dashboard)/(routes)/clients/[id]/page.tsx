import { notFound, redirect } from 'next/navigation'

import { auth } from '@clerk/nextjs/server'

import { getClientById } from '@/modules/clients/data'
import { ClientDetailView } from '@/modules/clients/ui/views'
import { getLoansByClientId } from '@/modules/loans/data/get-loans'

interface ClientIdPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ClientIdPage({ params }: ClientIdPageProps) {
  const { isAuthenticated } = await auth()

  if (!isAuthenticated) redirect('/sign-in')

  const { id } = await params
  const client = await getClientById(id)

  if (!client) {
    notFound()
  }

  const loans = await getLoansByClientId(id)

  return <ClientDetailView client={client} loans={loans} />
}
