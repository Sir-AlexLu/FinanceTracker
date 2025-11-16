'use client'

import { Toaster } from 'react-hot-toast'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
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
