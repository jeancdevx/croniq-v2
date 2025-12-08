import { redirect } from 'next/navigation'

import { auth } from '@clerk/nextjs/server'

import { RemindersView } from '@/modules/messages/ui/views'

export default async function MessagesReminderPage() {
  const { isAuthenticated } = await auth()

  if (!isAuthenticated) redirect('/sign-in')

  return <RemindersView />
}
