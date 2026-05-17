import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TontineBénin — Admin',
  description: 'Dashboard administrateur TontineBénin',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} h-full bg-[#F8FAFC]`}>
        {children}
      </body>
    </html>
  )
}
