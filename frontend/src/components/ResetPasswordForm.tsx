/**
 * Password Reset Form Component
 * Handles password reset with token from email link
 */

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api'

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    token: token || '',
    new_password: '',
    confirm_password: '',
  })

  const [showPassword, setShowPassword] = useState({
    new_password: false,
    confirm_password: false,
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const validateForm = (): string | null => {
    if (!formData.token) {
      return 'No reset token provided. Please use the link from your email.'
    }

    if (!formData.new_password) {
      return 'Please enter a new password'
    }

    if (formData.new_password.length < 8) {
      return 'Password must be at least 8 characters long'
    }

    if (formData.new_password !== formData.confirm_password) {
      return 'Passwords do not match'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await apiClient.post('/api/v1/auth/reset-password', {
        token: formData.token,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      })

      setMessage({
        type: 'success',
        text: 'Password reset successfully! Redirecting to login...',
      })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to reset password'

      setMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Reset Password
          </h1>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-400">
              No reset token found. Please use the link provided in your password
              reset email.
            </p>
          </div>
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">
          Reset Password
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 font-light">
          Enter your new password below
        </p>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}
          >
            <p
              className={`${
                message.type === 'success'
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label
              htmlFor="new_password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="new_password"
                name="new_password"
                type={showPassword.new_password ? 'text' : 'password'}
                value={formData.new_password}
                onChange={handleChange}
                placeholder="Enter new password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({
                    ...showPassword,
                    new_password: !showPassword.new_password,
                  })
                }
                className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword.new_password ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum 8 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirm_password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm_password"
                name="confirm_password"
                type={showPassword.confirm_password ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Confirm new password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({
                    ...showPassword,
                    confirm_password: !showPassword.confirm_password,
                  })
                }
                className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword.confirm_password ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        {/* Back to Login Link */}
        <p className="text-center text-gray-600 dark:text-gray-400 mt-6 font-light">
          Remember your password?{' '}
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}
