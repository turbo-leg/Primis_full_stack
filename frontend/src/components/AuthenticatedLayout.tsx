'use client'

import React from 'react'
import { Navigation } from '@/components/navigation'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-primis-navy">
      {/* Use the responsive Navigation component for all authenticated users */}
      <Navigation />

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
}
