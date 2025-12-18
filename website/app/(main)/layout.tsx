'use client'

import { Navbar } from '@/components/navbar';
import ToasterProvider from '@/components/toaster-provider';
import { SessionProvider } from 'next-auth/react';
import React, { Suspense } from 'react'

const MainLayout =  ({ children }: { children: React.ReactNode;}) => {
  return (
    <SessionProvider>
      <ToasterProvider />
    <div className='max-w-7xl mx-auto'>
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main className='flex justify-center max-w-7xl mx-auto h-full'>
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}

export default MainLayout
