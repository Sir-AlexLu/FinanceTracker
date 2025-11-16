import { Inter, Space_Grotesk } from 'next/font/google'
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import './globals.css'

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

export const metadata = {
  title: 'Finance Tracker',
  description: 'Master your money with style',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#3b82f6',
}

export default function RootLayout({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        {mounted && (
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
        )}
      </body>
    </html>
  )
}
