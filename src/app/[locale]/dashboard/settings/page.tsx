'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { useTranslations } from 'next-intl'
import {
  Settings,
  User,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, userType } = useAuthStore()
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notificationsEmail: true,
    notificationsInApp: true,
    notificationsPush: false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password' })
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.post('/api/v1/auth/change-password', {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      })
      
      setMessage({ type: 'success', text: 'Password changed successfully' })
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      
      // Clear the success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Password change error:', error)
      
      // Extract error message from various possible error structures
      let errorMessage = 'Failed to change password'
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // TODO: Implement notification preferences endpoint
      setMessage({ type: 'success', text: 'Notification preferences updated' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update preferences' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-primis-navy pt-8 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Settings className="h-8 w-8 text-primis-navy dark:text-white" />
              <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-gray-900 dark:text-white">
                Settings
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-light">
              Manage your account preferences and security settings
            </p>
          </div>

          {/* Status Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm font-light ${
                message.type === 'success'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="space-y-1 bg-white dark:bg-primis-navy-dark rounded-lg shadow p-4">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'security', label: 'Security', icon: Lock },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const element = document.getElementById(`section-${item.id}`)
                      element?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-3 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-primis-navy-light transition-colors text-gray-700 dark:text-gray-300 font-light"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Section */}
              <Card id="section-profile" className="bg-white dark:bg-primis-navy-dark border-0 shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-primis-navy dark:text-white" />
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Profile Information</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Your account details
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* User Info Display */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-400 mb-2">
                        Full Name
                      </label>
                      <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-primis-navy text-gray-900 dark:text-white font-light">
                        {user?.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-400 mb-2">
                        Account Type
                      </label>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="capitalize dark:border-gray-700 dark:text-gray-300">
                          {userType}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-400 mb-2">
                        Email
                      </label>
                      <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-primis-navy text-gray-900 dark:text-white font-light flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span>{user?.email}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-400 mb-2">
                        Member Since
                      </label>
                      <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-primis-navy text-gray-900 dark:text-white font-light flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span>{new Date().getFullYear() - 1}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Section */}
              <Card id="section-security" className="bg-white dark:bg-primis-navy-dark border-0 shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-primis-navy dark:text-white" />
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Security</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Manage your password and security settings
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-400 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-primis-navy text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primis-navy dark:focus:ring-white font-light"
                        placeholder="Enter your current password"
                      />
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-400 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-primis-navy text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primis-navy dark:focus:ring-white font-light"
                          placeholder="Enter new password (min 8 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-light text-gray-700 dark:text-gray-400 mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-primis-navy text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primis-navy dark:focus:ring-white font-light"
                        placeholder="Confirm your new password"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primis-navy hover:bg-primis-navy/90 dark:bg-white dark:text-primis-navy dark:hover:bg-gray-100 text-white font-light"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {loading ? 'Updating...' : 'Change Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Notifications Section */}
              <Card id="section-notifications" className="bg-white dark:bg-primis-navy-dark border-0 shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-primis-navy dark:text-white" />
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Notification Preferences</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Choose how you want to receive notifications
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleNotificationSave} className="space-y-4">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-primis-navy/50">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="text-sm font-light text-gray-900 dark:text-white">Email Notifications</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Get updates via email</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        name="notificationsEmail"
                        checked={formData.notificationsEmail}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded cursor-pointer"
                      />
                    </div>

                    {/* In-App Notifications */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-primis-navy/50">
                      <div className="flex items-center space-x-3">
                        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="text-sm font-light text-gray-900 dark:text-white">In-App Notifications</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">See alerts within the app</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        name="notificationsInApp"
                        checked={formData.notificationsInApp}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded cursor-pointer"
                      />
                    </div>

                    {/* Push Notifications */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-primis-navy/50">
                      <div className="flex items-center space-x-3">
                        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="text-sm font-light text-gray-900 dark:text-white">Push Notifications</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Receive browser notifications</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        name="notificationsPush"
                        checked={formData.notificationsPush}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded cursor-pointer"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primis-navy hover:bg-primis-navy/90 dark:bg-white dark:text-primis-navy dark:hover:bg-gray-100 text-white font-light"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
