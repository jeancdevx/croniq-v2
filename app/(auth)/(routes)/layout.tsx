interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className='flex min-h-svh flex-1 items-center justify-center'>
      {children}
    </main>
  )
}
