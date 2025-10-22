'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { useTranslations, useLocale } from 'next-intl'
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  TrendingUp,
  UserPlus,
  GraduationCap,
  BarChart3,
  Calendar,
  Settings,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  totalRevenue: number
  activeEnrollments: number
  pendingPayments: number
  monthlyRevenue: number
  averageAttendance: number
}

interface User {
  id: number
  name: string
  email: string
  user_type: string
  is_active: boolean
  created_at: string
  last_login?: string
}

interface Course {
  course_id: number
  title: string
  description: string
  start_time: string
  end_time: string
  price: number
  max_students: number
  enrolled_count: number
  is_online: boolean
  location: string
  status: string
  teacher_name?: string
  created_at: string
}

interface Enrollment {
  enrollment_id: number
  student_name: string
  course_title: string
  paid: boolean
  payment_due: string
  enrollment_date: string
  status: string
  amount: number
}

interface RecentActivity {
  id: number
  type: 'enrollment' | 'payment' | 'course_created' | 'user_registered'
  description: string
  timestamp: string
  user_name?: string
}

export default function AdminDashboard() {
  const { user, userType } = useAuthStore()
  const t = useTranslations()
  const locale = useLocale()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [pendingPayments, setPendingPayments] = useState<Enrollment[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // Type guard to check if user is an admin
  const isAdmin = (user: any): user is { admin_id: number; name: string; email: string; role: string } => {
    return user && userType === 'admin' && 'admin_id' in user
  }

  const fetchDashboardData = useCallback(async () => {
    if (!isAdmin(user)) return
    
    try {
      setLoading(true)
      
      // Fetch dashboard statistics (all from database now)
      try {
        const statsData = await apiClient.get('/api/v1/admin/stats')
        setStats(statsData)
        console.log('Admin stats loaded successfully:', statsData)
      } catch (error: any) {
        console.error('Failed to fetch admin stats:', error)
        if (error.response?.status === 401) {
          console.error('Authentication failed - user may not be logged in as admin')
          return
        }
        // Set empty stats on error
        setStats({
          totalStudents: 0,
          totalTeachers: 0,
          totalCourses: 0,
          totalRevenue: 0,
          activeEnrollments: 0,
          pendingPayments: 0,
          monthlyRevenue: 0,
          averageAttendance: 0
        })
      }

      // Fetch all courses
      try {
        const coursesData = await apiClient.get('/api/v1/courses')
        setCourses(coursesData)
        console.log('Courses loaded successfully:', coursesData.length, 'courses')
      } catch (error: any) {
        console.error('Failed to fetch courses:', error)
        if (error.response?.status === 401) {
          console.error('Authentication failed for courses endpoint')
          return
        }
        setCourses([])
      }

      // Fetch all teachers
      try {
        const teachersData = await apiClient.get('/api/v1/courses/teachers/all')
        setTeachers(teachersData)
        console.log('Teachers loaded successfully:', teachersData.length, 'teachers')
      } catch (error: any) {
        console.error('Failed to fetch teachers:', error)
        setTeachers([])
      }

      // Fetch recent users
      try {
        const usersData = await apiClient.get('/api/v1/admin/users/recent')
        setRecentUsers(usersData)
        console.log('Recent users loaded successfully:', usersData.length, 'users')
      } catch (error: any) {
        console.error('Failed to fetch recent users:', error)
        if (error.response?.status === 401) {
          console.error('Authentication failed for recent users endpoint')
          return
        }
        setRecentUsers([])
      }

      // Fetch pending payments
      try {
        const paymentsData = await apiClient.get('/api/v1/admin/payments/pending')
        setPendingPayments(paymentsData)
        console.log('Pending payments loaded successfully:', paymentsData.length, 'payments')
      } catch (error: any) {
        console.error('Failed to fetch pending payments:', error)
        if (error.response?.status === 401) {
          console.error('Authentication failed for pending payments endpoint')
          return
        }
        setPendingPayments([])
      }

      // Fetch recent activity
      try {
        const activityData = await apiClient.get('/api/v1/admin/activity/recent')
        setRecentActivity(activityData)
        console.log('Recent activity loaded successfully:', activityData.length, 'activities')
      } catch (error: any) {
        console.error('Failed to fetch recent activity:', error)
        if (error.response?.status === 401) {
          console.error('Authentication failed for recent activity endpoint')
          return
        }
        setRecentActivity([])
      }

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, userType])

  useEffect(() => {
    if (isAdmin(user)) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [user, userType, fetchDashboardData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: 'MNT'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment': return <UserPlus className="h-4 w-4 text-blue-600" />
      case 'payment': return <DollarSign className="h-4 w-4 text-green-600" />
      case 'course_created': return <BookOpen className="h-4 w-4 text-purple-600" />
      case 'user_registered': return <Users className="h-4 w-4 text-orange-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  // Course management functions
  const handleCreateCourse = async (courseData: any) => {
    try {
      await apiClient.post('/api/v1/courses', courseData)
      await fetchDashboardData() // Refresh data
      setShowCreateCourse(false)
    } catch (error) {
      console.error('Failed to create course:', error)
    }
  }

  const handleEditCourse = async (courseId: number, courseData: any) => {
    try {
      await apiClient.put(`/api/v1/courses/${courseId}`, courseData)
      await fetchDashboardData() // Refresh data
      setEditingCourse(null)
    } catch (error) {
      console.error('Failed to update course:', error)
    }
  }

  const handleDeleteCourse = async (courseId: number) => {
    if (window.confirm(t('dashboard.admin.confirmDeleteCourse'))) {
      try {
        await apiClient.delete(`/api/v1/courses/${courseId}`)
        await fetchDashboardData() // Refresh data
      } catch (error) {
        console.error('Failed to delete course:', error)
      }
    }
  }

  if (userType !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">{t('common.accessDenied')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t('dashboard.admin.accessMessage')}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.admin.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2">{t('dashboard.admin.welcomeBack', { name: user?.name || 'Admin' })}</p>
        </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="dark:bg-primis-navy-light dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">{t('dashboard.admin.totalStudents')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              {t('dashboard.admin.registeredStudents')}
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-primis-navy-light dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">{t('dashboard.admin.activeCourses')}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats?.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              {t('dashboard.admin.availableCourses')}
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-primis-navy-light dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">{t('dashboard.admin.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats ? formatCurrency(stats.totalRevenue) : '$0'}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              {t('dashboard.admin.allTimeRevenue')}
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-primis-navy-light dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">{t('dashboard.admin.avgAttendance')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{stats?.averageAttendance || 0}%</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              {t('dashboard.admin.platformAverage')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="dark:bg-primis-navy-light dark:border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <p className="text-2xl font-bold dark:text-white">{stats?.totalTeachers || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.admin.teachers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-primis-navy-light dark:border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <p className="text-2xl font-bold dark:text-white">{stats?.activeEnrollments || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.admin.activeEnrollments')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-primis-navy-light dark:border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mr-3" />
              <div>
                <p className="text-2xl font-bold dark:text-white">{stats?.pendingPayments || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.admin.pendingPayments')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-primis-navy-light dark:border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
              <div>
                <p className="text-2xl font-bold dark:text-white">{stats ? formatCurrency(stats.monthlyRevenue) : '$0'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.admin.thisMonth')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Course Management */}
        <Card className="dark:bg-primis-navy-light dark:border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <BookOpen className="h-5 w-5" />
                  {t('dashboard.admin.courseManagement')}
                </CardTitle>
                <CardDescription className="dark:text-gray-300">{t('dashboard.admin.manageAllPlatformCourses')}</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowCreateCourse(true)} className="dark:bg-blue-600 dark:hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                {t('dashboard.admin.newCourse')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.length > 0 ? (
                courses.slice(0, 5).map((course, index) => (
                  <div key={`course-${course.course_id || 'no-id'}-${index}-${course.title || 'no-title'}`} className="flex items-center justify-between p-3 border dark:border-white/10 rounded-lg dark:bg-primis-navy/30">
                    <div className="flex-1">
                      <h4 className="font-medium dark:text-white">{course.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{course.teacher_name || t('dashboard.admin.noTeacherAssigned')}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{course.enrolled_count || 0}/{course.max_students} {t('dashboard.admin.students')}</span>
                        <span>{formatCurrency(course.price)}</span>
                        {course.is_online ? (
                          <Badge variant="secondary" className="dark:bg-blue-900/50 dark:text-blue-200">{t('dashboard.admin.online')}</Badge>
                        ) : (
                          <span>{course.location}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" title="View Course" className="dark:border-white/20 dark:hover:bg-white/10">
                          <Eye className="h-3 w-3 dark:text-white" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCourse(course)} title="Edit Course" className="dark:border-white/20 dark:hover:bg-white/10">
                          <Edit className="h-3 w-3 dark:text-white" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteCourse(course.course_id)} title="Delete Course" className="dark:border-white/20 dark:hover:bg-white/10">
                          <Trash2 className="h-3 w-3 dark:text-white" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('dashboard.admin.noCoursesCreatedYet')}</p>
              )}
              {courses.length > 5 && (
                <Button variant="outline" className="w-full dark:border-white/20 dark:text-white dark:hover:bg-white/10">
                  {t('dashboard.admin.viewAllCourses', { count: courses.length })}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="dark:bg-primis-navy-light dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Clock className="h-5 w-5" />
              {t('dashboard.admin.recentActivity')}
            </CardTitle>
            <CardDescription className="dark:text-gray-300">{t('dashboard.admin.latestPlatformActivity')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={`activity-${activity.id || 'no-id'}-${index}-${activity.type || 'no-type'}`} className="flex items-start gap-3 p-3 border dark:border-white/10 rounded-lg dark:bg-primis-navy/30">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium dark:text-white">{activity.description}</p>
                      {activity.user_name && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">{t('dashboard.admin.by')} {activity.user_name}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('dashboard.admin.noRecentActivity')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="dark:bg-primis-navy-light dark:border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Users className="h-5 w-5" />
                  {t('dashboard.admin.recentUsers')}
                </CardTitle>
                <CardDescription className="dark:text-gray-300">{t('dashboard.admin.recentlyRegisteredUsers')}</CardDescription>
              </div>
              <Button size="sm" className="dark:bg-blue-600 dark:hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                {t('dashboard.admin.addUser')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length > 0 ? (
                recentUsers.map((user, index) => (
                  <div key={`user-${user.id || 'no-id'}-${index}-${user.email || 'no-email'}`} className="flex items-center justify-between p-3 border dark:border-white/10 rounded-lg dark:bg-primis-navy/30">
                    <div className="flex-1">
                      <h4 className="font-medium dark:text-white">{user.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('dashboard.admin.joined')}: {formatDate(user.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-2 dark:bg-gray-700 dark:text-gray-200">
                        {user.user_type}
                      </Badge>
                      <br />
                      <Badge className={getStatusColor(user.is_active ? 'active' : 'inactive')}>
                        {user.is_active ? t('dashboard.admin.active') : t('dashboard.admin.inactive')}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('dashboard.admin.noRecentUsers')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="dark:bg-primis-navy-light dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <DollarSign className="h-5 w-5" />
              {t('dashboard.admin.pendingPayments')}
            </CardTitle>
            <CardDescription className="dark:text-gray-300">{t('dashboard.admin.paymentsRequiringAttention')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.length > 0 ? (
                pendingPayments.map((payment, index) => (
                  <div key={`payment-${payment.enrollment_id || 'no-id'}-${index}-${payment.student_name || 'no-name'}`} className="flex items-center justify-between p-3 border dark:border-white/10 rounded-lg dark:bg-primis-navy/30">
                    <div className="flex-1">
                      <h4 className="font-medium dark:text-white">{payment.student_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{payment.course_title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('dashboard.admin.due')}: {formatDate(payment.payment_due)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium dark:text-white">{formatCurrency(payment.amount)}</p>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('dashboard.admin.noPendingPayments')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8 dark:bg-primis-navy-light dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Settings className="h-5 w-5" />
            {t('dashboard.admin.quickActions')}
          </CardTitle>
          <CardDescription className="dark:text-gray-300">{t('dashboard.admin.commonAdministrativeTasks')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col dark:border-white/20 dark:text-white dark:hover:bg-white/10">
              <UserPlus className="h-6 w-6 mb-2" />
              {t('dashboard.admin.addUser')}
            </Button>
            <Button variant="outline" className="h-20 flex-col dark:border-white/20 dark:text-white dark:hover:bg-white/10">
              <BookOpen className="h-6 w-6 mb-2" />
              {t('dashboard.admin.createCourse')}
            </Button>
            <Button variant="outline" className="h-20 flex-col dark:border-white/20 dark:text-white dark:hover:bg-white/10">
              <BarChart3 className="h-6 w-6 mb-2" />
              {t('dashboard.admin.viewReports')}
            </Button>
            <Button variant="outline" className="h-20 flex-col dark:border-white/20 dark:text-white dark:hover:bg-white/10">
              <Settings className="h-6 w-6 mb-2" />
              {t('dashboard.admin.systemSettings')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Course Creation Modal */}
      {showCreateCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-primis-navy-light p-6 rounded-lg w-full max-w-md border dark:border-white/10">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('dashboard.admin.createNewCourse')}</h3>
            <CourseForm 
              teachers={teachers}
              onSubmit={handleCreateCourse}
              onCancel={() => setShowCreateCourse(false)}
            />
          </div>
        </div>
      )}

      {/* Course Edit Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-primis-navy-light p-6 rounded-lg w-full max-w-md border dark:border-white/10">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('dashboard.admin.editCourse')}</h3>
            <CourseForm 
              course={editingCourse}
              teachers={teachers}
              onSubmit={(data) => handleEditCourse(editingCourse.course_id, data)}
              onCancel={() => setEditingCourse(null)}
            />
          </div>
        </div>
      )}
    </div>
    </AuthenticatedLayout>
  )
}

// Course Form Component
function CourseForm({ course, teachers, onSubmit, onCancel }: { 
  course?: Course; 
  teachers: any[];
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) {
  const t = useTranslations()
  const [formData, setFormData] = React.useState({
    title: course?.title || '',
    description: course?.description || '',
    price: course?.price || 0,
    max_students: course?.max_students || 30,
    is_online: course?.is_online || false,
    location: course?.location || '',
    start_time: course?.start_time || '',
    end_time: course?.end_time || '',
    teacher_ids: (course as any)?.teacher_ids || []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-200">{t('dashboard.admin.courseTitle')}</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full p-2 border dark:border-white/20 rounded dark:bg-primis-navy/50 dark:text-white"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-200">{t('dashboard.admin.description')}</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full p-2 border dark:border-white/20 rounded dark:bg-primis-navy/50 dark:text-white"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-200">{t('dashboard.admin.assignTeachersRequired')}</label>
        <select
          multiple
          value={formData.teacher_ids}
          onChange={(e) => {
            const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value))
            setFormData({...formData, teacher_ids: selectedOptions})
          }}
          className="w-full p-2 border dark:border-white/20 rounded min-h-[100px] dark:bg-primis-navy/50 dark:text-white"
          required={formData.teacher_ids.length === 0}
        >
          {teachers.map((teacher) => (
            <option key={teacher.teacher_id} value={teacher.teacher_id}>
              {teacher.name} - {teacher.specialization || 'No specialization'}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.admin.holdCtrlToSelectMultiple')}</p>
        {formData.teacher_ids.length > 0 && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            {formData.teacher_ids.length} {t('dashboard.admin.teachersSelected')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">{t('dashboard.admin.price')}</label>
          <input
            type="number"
            value={formData.price || ''}
            onChange={(e) => setFormData({...formData, price: e.target.value ? parseFloat(e.target.value) : 0})}
            className="w-full p-2 border dark:border-white/20 rounded dark:bg-primis-navy/50 dark:text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">{t('dashboard.admin.maxStudents')}</label>
          <input
            type="number"
            value={formData.max_students || ''}
            onChange={(e) => setFormData({...formData, max_students: e.target.value ? parseInt(e.target.value) : 0})}
            className="w-full p-2 border dark:border-white/20 rounded dark:bg-primis-navy/50 dark:text-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="flex items-center dark:text-gray-200">
          <input
            type="checkbox"
            checked={formData.is_online}
            onChange={(e) => setFormData({...formData, is_online: e.target.checked})}
            className="mr-2 dark:bg-primis-navy/50"
          />
          {t('dashboard.admin.onlineCourse')}
        </label>
      </div>

      {!formData.is_online && (
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">{t('dashboard.admin.location')}</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="w-full p-2 border dark:border-white/20 rounded dark:bg-primis-navy/50 dark:text-white"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">{t('dashboard.admin.startTime')}</label>
          <input
            type="datetime-local"
            value={formData.start_time}
            onChange={(e) => setFormData({...formData, start_time: e.target.value})}
            className="w-full p-2 border dark:border-white/20 rounded dark:bg-primis-navy/50 dark:text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">{t('dashboard.admin.endTime')}</label>
          <input
            type="datetime-local"
            value={formData.end_time}
            onChange={(e) => setFormData({...formData, end_time: e.target.value})}
            className="w-full p-2 border dark:border-white/20 rounded dark:bg-primis-navy/50 dark:text-white"
            required
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 dark:bg-blue-600 dark:hover:bg-blue-700">
          {course ? t('dashboard.admin.updateCourse') : t('dashboard.admin.createCourse')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 dark:border-white/20 dark:text-white dark:hover:bg-white/10">
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}