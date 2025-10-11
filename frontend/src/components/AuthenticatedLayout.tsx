'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, BookOpen, LogOut, User } from 'lucide-react'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, userType } = useAuthStore()

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_data')
    router.push('/login')
  }

  const handleDashboard = () => {
    if (userType) {
      router.push(`/dashboard/${userType}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 
                className="text-xl font-bold text-blue-600 cursor-pointer" 
                onClick={handleDashboard}
              >
                College Prep
              </h1>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDashboard}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/courses')}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Courses
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{user?.name}</span>
                <Badge variant="outline" className="capitalize">
                  {userType}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
}
