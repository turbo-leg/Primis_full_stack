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
import { Badge } from '@/components/ui/badge'
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, User, Phone, Calendar } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { toast } from 'react-hot-toast'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  parentEmail: z.string().email('Please enter a valid parent email address').optional(),
  parentPhone: z.string().optional(),
  userType: z.enum(['student', 'teacher'], {
    required_error: 'Please select a user type',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // If student, parent email and phone are required
  if (data.userType === 'student') {
    return data.parentEmail && data.parentPhone;
  }
  return true;
}, {
  message: "Parent email and phone are required for students",
  path: ["parentEmail"],
})

type RegisterFormData = z.infer<typeof registerSchema>

const userTypes = [
  {
    value: 'student' as const,
    label: 'Student',
    description: 'Access courses, track progress, and submit assignments',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    value: 'teacher' as const,
    label: 'Teacher',
    description: 'Manage courses, grade assignments, and track student progress',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
]

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUserType, setSelectedUserType] = useState<'student' | 'teacher' | null>(null)
  const router = useRouter()
  const { register: registerUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      // Convert camelCase to snake_case for backend
      const registerData: any = {
        name: data.name,
        email: data.email,
        password: data.password,
      }
      
      // Add optional phone
      if (data.phone) {
        registerData.phone = data.phone
      }
      
      // Add parent contact info for students
      if (data.userType === 'student' && data.parentEmail && data.parentPhone) {
        registerData.parent_email = data.parentEmail
        registerData.parent_phone = data.parentPhone
      }
      
      console.log('Sending registration data:', registerData)
      await registerUser(registerData)
      toast.success('Registration successful! Please log in to continue.')
      router.push('/login')
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.detail || error.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserTypeSelect = (userType: 'student' | 'teacher') => {
    setSelectedUserType(userType)
    setValue('userType', userType)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 h-12 w-12 rounded-lg flex items-center justify-center shadow-lg">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">College Prep Platform</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Our Community</h1>
          <p className="text-gray-600">Create your account to start your educational journey</p>
        </div>

        {/* Registration Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Fill in your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* User Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">I am a:</label>
                <div className="grid grid-cols-1 gap-3">
                  {userTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedUserType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleUserTypeSelect(type.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{type.label}</span>
                            <Badge variant="outline" className={type.color}>
                              {type.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedUserType === type.value
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedUserType === type.value && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.userType && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.userType.message}</span>
                  </div>
                )}
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10"
                    {...register('name')}
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.name.message}</span>
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...register('email')}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.email.message}</span>
                  </div>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    className="pl-10"
                    {...register('phone')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Parent Contact Fields - Only for Students */}
              {selectedUserType === 'student' && (
                <>
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Parent/Guardian Contact Information</h3>
                  </div>

                  {/* Parent Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="parentEmail" className="text-sm font-medium text-gray-700">
                      Parent/Guardian Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="parentEmail"
                        type="email"
                        placeholder="Enter parent/guardian email"
                        className="pl-10"
                        {...register('parentEmail')}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.parentEmail && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.parentEmail.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Parent Phone Field */}
                  <div className="space-y-2">
                    <label htmlFor="parentPhone" className="text-sm font-medium text-gray-700">
                      Parent/Guardian Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="parentPhone"
                        type="tel"
                        placeholder="Enter parent/guardian phone number"
                        className="pl-10"
                        {...register('parentPhone')}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.parentPhone && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.parentPhone.message}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    className="pl-10 pr-10"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.password.message}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10"
                    {...register('confirmPassword')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.confirmPassword.message}</span>
                  </div>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  required
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                />
                <label className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Sign In Instead
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}