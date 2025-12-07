import Link from 'next/link'

interface AccountLayoutProps {
  children: React.ReactNode
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <main className='flex min-h-svh flex-col items-center justify-center gap-y-4'>
      <Link href='/'>Volver</Link>
      {children}
    </main>
  )
}
