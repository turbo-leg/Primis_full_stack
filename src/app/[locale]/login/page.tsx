'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { getDashboardPath } from '@/utils/auth'
import { toast } from 'react-hot-toast'
import { useTranslations } from 'next-intl'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuthStore()
  const t = useTranslations()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const userType = await login(data.email, data.password)
      toast.success('Login successful!')
      
      // Redirect based on user type using helper function
      const redirectPath = getDashboardPath(userType)
      router.push(redirectPath)
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-primis-navy-dark dark:via-primis-navy dark:to-primis-navy-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-white/20 dark:to-white/10 h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center shadow-lg">
              <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('common.appName')}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('auth.loginTitle')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{t('auth.login')}</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-primis-navy-light/50 backdrop-blur-sm dark:border dark:border-white/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center dark:text-white">{t('auth.signIn')}</CardTitle>
            <CardDescription className="text-center dark:text-gray-300">
              {t('auth.login')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-300" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.email')}
                    className="pl-10 dark:bg-primis-navy/50 dark:border-white/20 dark:text-white dark:placeholder:text-gray-400"
                    {...register('email')}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center space-x-1 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.email.message}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-300" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.password')}
                    className="pl-10 pr-10 dark:bg-primis-navy/50 dark:border-white/20 dark:text-white dark:placeholder:text-gray-400"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center space-x-1 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.password.message}</span>
                  </div>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-white/20 text-blue-600 focus:ring-blue-500 dark:bg-primis-navy/50"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{t('auth.rememberMe')}</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('common.loading')}</span>
                  </div>
                ) : (
                  t('auth.signIn')
                )}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-primis-navy/30 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Demo Accounts:</h4>
              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <div>Student: john.smith@student.com / password123</div>
                <div>Teacher: dr.wilson@teacher.com / password123</div>
                <div>Admin: admin@college.com / password123</div>
                <div>Parent: mary.johnson@parent.com / password123</div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-primis-navy-light text-gray-500 dark:text-gray-300">{t('auth.dontHaveAccount')}</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <Link href="/register">
                <Button variant="outline" className="w-full dark:border-white/20 dark:text-white dark:hover:bg-white/10">
                  {t('auth.register')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
            ← {t('common.back')} {t('nav.dashboard')}
          </Link>
        </div>
      </div>
    </div>
  )
}