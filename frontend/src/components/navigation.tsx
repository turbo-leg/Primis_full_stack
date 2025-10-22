'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PrimisLogo from '@/components/PrimisLogo'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { 
  GraduationCap, 
  Menu, 
  X, 
  Home, 
  BookOpen, 
  Users, 
  Settings,
  LogOut,
  Bell,
  Search
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import NotificationBell from '@/components/NotificationBell'

interface NavigationProps {
  className?: string
}

export function Navigation({ className }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, userType, logout } = useAuthStore()
  const router = useRouter()

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar')
      const menuButton = document.getElementById('menu-button')
      
      if (isOpen && sidebar && !sidebar.contains(event.target as Node) && 
          menuButton && !menuButton.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLogout = () => {
    // Clear all auth data
    logout()
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('auth-storage')
    
    // Force a hard redirect to ensure clean state
    window.location.href = '/login'
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
    ]

    const settingsItem = { href: '/dashboard/settings', label: 'Settings', icon: Settings }

    switch (userType) {
      case 'student':
        return [
          ...baseItems,
          settingsItem,
        ]
      case 'teacher':
        return [
          ...baseItems,
          settingsItem,
        ]
      case 'admin':
        return [
          ...baseItems,
          settingsItem,
        ]
      case 'parent':
        return [
          ...baseItems,
          settingsItem,
        ]
      default:
        return baseItems
    }
  }

  const menuItems = getMenuItems()

  return (
    <>
      <nav className={`bg-primis-navy shadow-lg relative z-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-4">
              <PrimisLogo variant="light" size="sm" showTagline={false} />
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
                  className="flex items-center space-x-2 text-white/80 hover:text-white px-3 py-2 rounded-md hover:bg-primis-navy-light transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-light">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop-only controls - hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {user ? (
                <>
                  {/* Search */}
                  <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-primis-navy-light">
                    <Search className="h-4 w-4" />
                  </Button>

                  {/* Notifications */}
                  <NotificationBell />

                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">{user.name}</div>
                      <div className="text-xs text-white/60 capitalize">{userType}</div>
                    </div>
                    <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
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
                    className="text-white/80 hover:text-white hover:bg-primis-navy-light"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-primis-navy-light">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-white text-primis-navy hover:bg-white/90">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button - only visible on mobile */}
            <Button
              id="menu-button"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-white/80 hover:text-white hover:bg-primis-navy-light"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        id="mobile-sidebar"
        className={`fixed top-0 left-0 h-full w-72 bg-primis-navy dark:bg-primis-navy-dark shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/" onClick={() => setIsOpen(false)}>
            <PrimisLogo variant="light" size="sm" showTagline={false} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white hover:bg-primis-navy-light"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex flex-col h-[calc(100%-73px)] overflow-y-auto">
          {/* User Info Section */}
          {user && (
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{user.name}</div>
                  <div className="text-xs text-white/60 capitalize">{userType}</div>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="flex-1 py-4 px-2">
            <div className="space-y-1">
              {/* Notifications Link for mobile */}
              {user && (
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 text-white/80 hover:text-white px-4 py-3 rounded-lg hover:bg-primis-navy-light transition-all duration-200 group"
                >
                  <Bell className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-light">Notifications</span>
                </Link>
              )}
              
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 text-white/80 hover:text-white px-4 py-3 rounded-lg hover:bg-primis-navy-light transition-all duration-200 group"
                  >
                    <Icon className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-light">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10 space-y-2">
            {/* Preferences/Utilities */}
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs text-white/60 font-light">Preferences</span>
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </div>

            {/* Logout Button */}
            {user && (
              <button
                onClick={() => {
                  setIsOpen(false)
                  handleLogout()
                }}
                className="flex items-center space-x-3 text-white/80 hover:text-white px-4 py-3 rounded-lg hover:bg-red-600/20 transition-all duration-200 w-full group"
              >
                <LogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-light">Log Out</span>
              </button>
            )}

            {/* Login/Register for guests */}
            {!user && (
              <div className="space-y-2">
                <Link href="/login" onClick={() => setIsOpen(false)} className="block">
                  <Button variant="ghost" className="w-full text-white/80 hover:text-white hover:bg-primis-navy-light justify-start">
                    Log In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsOpen(false)} className="block">
                  <Button className="w-full bg-white text-primis-navy hover:bg-white/90">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}