import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import ClientProviders from './ClientProviders'

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

// ← Metadata is allowed here (Server Component)
export const metadata = {
  title: 'Finance Tracker',
  description: 'Master your money with style',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#3b82f6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <ClientProviders>
          <main className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  )
}
