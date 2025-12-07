import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'

import { ClerkProvider } from '@clerk/nextjs'

import { Toaster } from '@/components/ui/sonner'

import '@/styles/globals.css'

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '700', '900']
})

export const metadata: Metadata = {
  title: 'Croniq - Gestión de Préstamos',
  description: 'Sistema de Gestión de Préstamos'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang='es'>
        <body className={`${nunito.className} antialiased`}>
          {children}

          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}
