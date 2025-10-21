'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import AssignmentList from '@/components/AssignmentList'
import AssignmentDetails from '@/components/AssignmentDetails'
import {
  Users,
  BookOpen,
  FileText,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  Loader2
} from 'lucide-react'

interface Course {
  course_id: number
  title: string
  description: string
  start_time: string
  end_time: string
  is_online: boolean
  location: string
  status: string
  max_students: number
}

interface Student {
  student_id: number
  name: string
  email: string
}

interface CourseWithStats extends Course {
  enrolled_students?: number
  recent_students?: Student[]
}

interface Assignment {
  assignment_id: number
  course_id: number
  course_title: string
  title: string
  description: string
  due_date: string
  max_points: number
  submissions_count?: number
}

type ViewMode = 'overview' | 'courses' | 'assignments' | 'assignment-detail' | 'students' | 'analytics'

export default function TeacherDashboard() {
  const router = useRouter()
  const { user, userType } = useAuthStore()
  const [courses, setCourses] = useState<CourseWithStats[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isTeacher = (user: any): user is { teacher_id: number; name: string; email: string } => {
    return user && userType === 'teacher' && 'teacher_id' in user
  }

  useEffect(() => {
    if (isTeacher(user)) {
      fetchDashboardData()
    }
  }, [user, userType])

  const fetchDashboardData = async () => {
    if (!isTeacher(user)) return

    try {
      setLoading(true)
      setError(null)

      // Fetch teacher's courses
      const coursesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teachers/${user.teacher_id}/courses`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        setCourses(coursesData)
      }

      // Fetch assignments
      const assignmentsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teachers/${user.teacher_id}/assignments`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setAssignments(assignmentsData)
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (userType !== 'teacher') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">This page is only accessible to teachers.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">Manage your courses, assignments, and student progress.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'courses', label: 'My Courses', icon: '📚' },
              { id: 'assignments', label: 'Assignments', icon: '📝' },
              { id: 'students', label: 'Students', icon: '👥' },
              { id: 'analytics', label: 'Analytics', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setViewMode(tab.id as ViewMode)
                  if (tab.id !== 'assignment-detail') {
                    setSelectedAssignment(null)
                  }
                }}
                className={`${
                  viewMode === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors flex items-center gap-2`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg text-red-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Overview Tab */}
        {viewMode === 'overview' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courses.length}</div>
                  <p className="text-xs text-muted-foreground">Total courses teaching</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {courses.reduce((sum, c) => sum + (c.enrolled_students || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Enrolled students</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignments.length}</div>
                  <p className="text-xs text-muted-foreground">Total assignments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {assignments.reduce((sum, a) => {
                      const pending = (a.submissions_count || 0)
                      return sum + pending
                    }, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total submissions</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Your Courses
                </CardTitle>
                <CardDescription>Recently taught courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {courses.slice(0, 5).map(course => (
                    <div
                      key={course.course_id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{course.title}</h4>
                        <p className="text-sm text-gray-600">{course.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{formatTime(course.start_time)} - {formatTime(course.end_time)}</span>
                          {!course.is_online && <span>{course.location}</span>}
                          <span className="font-semibold">
                            {course.enrolled_students || 0}/{course.max_students} students
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(course.status)}>
                          {course.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/courses/${course.course_id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Courses Tab */}
        {viewMode === 'courses' && (
          <div className="space-y-6">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create New Course
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <Card key={course.course_id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatDate(course.start_time)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        {formatTime(course.start_time)} - {formatTime(course.end_time)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        {course.enrolled_students || 0} / {course.max_students} students
                      </div>
                    </div>
                    <Badge className={getStatusColor(course.status)}>
                      {course.status}
                    </Badge>
                    <Button
                      className="w-full"
                      onClick={() => router.push(`/courses/${course.course_id}`)}
                    >
                      View Course
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {viewMode === 'assignments' && !selectedAssignment && (
          <AssignmentList
            type="teacher"
            onSelectAssignment={(assignment) => {
              setSelectedAssignment(assignment)
              setViewMode('assignment-detail')
            }}
            onCreateAssignment={() => router.push('/create-assignment')}
          />
        )}

        {/* Assignment Detail Tab */}
        {viewMode === 'assignment-detail' && selectedAssignment && (
          <AssignmentDetails
            assignmentId={selectedAssignment.assignment_id}
            type="teacher"
            onBack={() => {
              setSelectedAssignment(null)
              setViewMode('assignments')
            }}
          />
        )}

        {/* Students Tab */}
        {viewMode === 'students' && (
          <Card>
            <CardHeader>
              <CardTitle>My Students</CardTitle>
              <CardDescription>All students enrolled in your courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Students view coming soon
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab */}
        {viewMode === 'analytics' && (
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Student performance and course insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Analytics dashboard coming soon
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
