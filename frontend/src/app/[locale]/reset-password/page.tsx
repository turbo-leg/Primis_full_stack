/**
 * Reset Password Page
 * Page wrapper for ResetPasswordForm component
 */

'use client'

import { Suspense } from 'react'
import ResetPasswordForm from '@/components/ResetPasswordForm'

function ResetPasswordContent() {
  return <ResetPasswordForm />
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}

