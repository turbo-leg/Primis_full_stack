'use client'

import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getDashboardPath } from '@/utils/auth'

export default function AuthRedirect() {
  const { isAuthenticated, userType } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && userType) {
      // Redirect based on user type
      const redirectPath = getDashboardPath(userType)
      router.push(redirectPath)
    }
  }, [isAuthenticated, userType, router])

  return null
}