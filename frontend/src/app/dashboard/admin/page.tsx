'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [pendingPayments, setPendingPayments] = useState<Enrollment[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // Type guard to check if user is an admin
  const isAdmin = (user: any): user is { admin_id: number; name: string; email: string; role: string } => {
    return user && userType === 'admin' && 'admin_id' in user
  }

  useEffect(() => {
    if (isAdmin(user)) {
      fetchDashboardData()
    }
  }, [user, userType])

  const fetchDashboardData = async () => {
    if (!isAdmin(user)) return
    
    try {
      setLoading(true)
      
      // Fetch dashboard statistics
      try {
        const statsData = await apiClient.get('/api/v1/admin/stats')
        setStats(statsData)
        console.log('Admin stats loaded successfully:', statsData)
      } catch (error: any) {
        console.error('Failed to fetch admin stats:', error)
        // Check if it's an authentication error
        if (error.response?.status === 401) {
          console.error('Authentication failed - user may not be logged in as admin')
          return // Don't fall back to mock data for auth errors
        }
        // For other errors, still use mock data for development
        console.log('Using mock data for admin stats')
        setStats({
          totalStudents: 150,
          totalTeachers: 12,
          totalCourses: 25,
          totalRevenue: 125000,
          activeEnrollments: 320,
          pendingPayments: 15,
          monthlyRevenue: 18500,
          averageAttendance: 92
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
        // Set empty array instead of mock data to show real state
        setRecentActivity([])
      }

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
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
    if (window.confirm('Are you sure you want to delete this course?')) {
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
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">This page is only accessible to administrators.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}! Manage your platform.</p>
        </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? formatCurrency(stats.totalRevenue) : '$0'}</div>
            <p className="text-xs text-muted-foreground">
              All time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageAttendance || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Platform average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalTeachers || 0}</p>
                <p className="text-sm text-gray-600">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats?.activeEnrollments || 0}</p>
                <p className="text-sm text-gray-600">Active Enrollments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats?.pendingPayments || 0}</p>
                <p className="text-sm text-gray-600">Pending Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats ? formatCurrency(stats.monthlyRevenue) : '$0'}</p>
                <p className="text-sm text-gray-600">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Course Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Management
                </CardTitle>
                <CardDescription>Manage all platform courses</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowCreateCourse(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.length > 0 ? (
                courses.slice(0, 5).map((course, index) => (
                  <div key={`course-${course.course_id || 'no-id'}-${index}-${course.title || 'no-title'}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-gray-600">{course.teacher_name || 'No teacher assigned'}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{course.enrolled_count || 0}/{course.max_students} students</span>
                        <span>{formatCurrency(course.price)}</span>
                        {course.is_online ? (
                          <Badge variant="secondary">Online</Badge>
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
                        <Button size="sm" variant="outline" title="View Course">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCourse(course)} title="Edit Course">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteCourse(course.course_id)} title="Delete Course">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No courses created yet.</p>
              )}
              {courses.length > 5 && (
                <Button variant="outline" className="w-full">
                  View All Courses ({courses.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest platform activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={`activity-${activity.id || 'no-id'}-${index}-${activity.type || 'no-type'}`} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      {activity.user_name && (
                        <p className="text-xs text-gray-600">by {activity.user_name}</p>
                      )}
                      <p className="text-xs text-gray-500">{formatDateTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No recent activity.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Users
                </CardTitle>
                <CardDescription>Recently registered users</CardDescription>
              </div>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length > 0 ? (
                recentUsers.map((user, index) => (
                  <div key={`user-${user.id || 'no-id'}-${index}-${user.email || 'no-email'}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Joined: {formatDate(user.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-2">
                        {user.user_type}
                      </Badge>
                      <br />
                      <Badge className={getStatusColor(user.is_active ? 'active' : 'inactive')}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No recent users.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pending Payments
            </CardTitle>
            <CardDescription>Payments requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.length > 0 ? (
                pendingPayments.map((payment, index) => (
                  <div key={`payment-${payment.enrollment_id || 'no-id'}-${index}-${payment.student_name || 'no-name'}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{payment.student_name}</h4>
                      <p className="text-sm text-gray-600">{payment.course_title}</p>
                      <p className="text-xs text-gray-500">
                        Due: {formatDate(payment.payment_due)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No pending payments.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <UserPlus className="h-6 w-6 mb-2" />
              Add User
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BookOpen className="h-6 w-6 mb-2" />
              Create Course
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              View Reports
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Settings className="h-6 w-6 mb-2" />
              System Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Course Creation Modal */}
      {showCreateCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Course</h3>
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
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Course</h3>
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
        <label className="block text-sm font-medium mb-1">Course Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Assign Teachers (Required)</label>
        <select
          multiple
          value={formData.teacher_ids}
          onChange={(e) => {
            const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value))
            setFormData({...formData, teacher_ids: selectedOptions})
          }}
          className="w-full p-2 border rounded min-h-[100px]"
          required={formData.teacher_ids.length === 0}
        >
          {teachers.map((teacher) => (
            <option key={teacher.teacher_id} value={teacher.teacher_id}>
              {teacher.name} - {teacher.specialization || 'No specialization'}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple teachers</p>
        {formData.teacher_ids.length > 0 && (
          <p className="text-xs text-green-600 mt-1">
            {formData.teacher_ids.length} teacher(s) selected
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Price ($)</label>
          <input
            type="number"
            value={formData.price || ''}
            onChange={(e) => setFormData({...formData, price: e.target.value ? parseFloat(e.target.value) : 0})}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Max Students</label>
          <input
            type="number"
            value={formData.max_students || ''}
            onChange={(e) => setFormData({...formData, max_students: e.target.value ? parseInt(e.target.value) : 0})}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_online}
            onChange={(e) => setFormData({...formData, is_online: e.target.checked})}
            className="mr-2"
          />
          Online Course
        </label>
      </div>

      {!formData.is_online && (
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Time</label>
          <input
            type="datetime-local"
            value={formData.start_time}
            onChange={(e) => setFormData({...formData, start_time: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">End Time</label>
          <input
            type="datetime-local"
            value={formData.end_time}
            onChange={(e) => setFormData({...formData, end_time: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {course ? 'Update' : 'Create'} Course
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}