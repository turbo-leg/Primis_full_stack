'use client'

import { useAuthStore } from '@/store/auth'
import { UserType } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles: UserType[]
  fallbackPath?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, userType, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(fallbackPath)
        return
      }

      if (userType && !allowedRoles.includes(userType)) {
        // Redirect to their appropriate dashboard
        router.push('/login')
        return
      }
    }
  }, [isAuthenticated, userType, isLoading, allowedRoles, fallbackPath, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!isAuthenticated || (userType && !allowedRoles.includes(userType))) {
    return null
  }

  return <>{children}</>
}