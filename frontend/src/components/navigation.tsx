'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  GraduationCap, 
  Menu, 
  X, 
  Home, 
  BookOpen, 
  Users, 
  Calendar, 
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'

interface NavigationProps {
  className?: string
}

export function Navigation({ className }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, userType, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const getMenuItems = () => {
    if (!user) {
      return [
        { href: '/', label: 'Home', icon: Home },
        { href: '/about', label: 'About', icon: BookOpen },
        { href: '/contact', label: 'Contact', icon: Users },
      ]
    }

    const baseItems = [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/courses', label: 'Courses', icon: BookOpen },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
    ]

    switch (userType) {
      case 'student':
        return [
          ...baseItems,
          { href: '/assignments', label: 'Assignments', icon: BookOpen },
          { href: '/attendance', label: 'Attendance', icon: BarChart3 },
          { href: '/grades', label: 'Grades', icon: BarChart3 },
        ]
      case 'teacher':
        return [
          ...baseItems,
          { href: '/students', label: 'Students', icon: Users },
          { href: '/attendance/mark', label: 'Mark Attendance', icon: BarChart3 },
          { href: '/assignments/grade', label: 'Grade Assignments', icon: BookOpen },
          { href: '/analytics', label: 'Analytics', icon: BarChart3 },
        ]
      case 'admin':
        return [
          ...baseItems,
          { href: '/users', label: 'User Management', icon: Users },
          { href: '/analytics', label: 'Analytics', icon: BarChart3 },
          { href: '/settings', label: 'Settings', icon: Settings },
          { href: '/reports', label: 'Reports', icon: BarChart3 },
        ]
      default:
        return baseItems
    }
  }

  const menuItems = getMenuItems()

  return (
    <nav className={`bg-white shadow-lg border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 h-10 w-10 rounded-lg flex items-center justify-center shadow-md">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-gray-900">College Prep Platform</span>
                <div className="text-xs text-gray-500">Empowering Academic Success</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-blue-50 transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Search */}
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <Search className="h-4 w-4" />
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    3
                  </Badge>
                </Button>

                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{userType}</div>
                  </div>
                  <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Logout */}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-blue-50 transition-all duration-200"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
              
              {user && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{userType}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 text-red-600 px-3 py-2 rounded-md hover:bg-red-50 transition-all duration-200 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}