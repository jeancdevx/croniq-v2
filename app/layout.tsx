import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import '../styles/globals.css'

const inter = Inter({
  variable: '--font-inter',
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
    <html lang='es'>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
