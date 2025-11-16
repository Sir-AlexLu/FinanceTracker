'use client'

import { Inter, Space_Grotesk } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

// Fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

// Metadata (still works in Client Component in Next.js 14+)
export const metadata = {
  title: 'Finance Tracker',
  description: 'Master your money with style',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#3b82f6',
}

// Client Wrapper (now at top, after 'use client')
function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        {children}
      </main>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          className: 'glass-neumorph',
        }}
      />
    </>
  )
}

// Root Layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  )
}
