'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import MonthlyAttendanceReport from '@/components/MonthlyAttendanceReport'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText, 
  TrendingUp,
  Users,
  Bell,
  Download,
  QrCode,
  X
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
}

interface Enrollment {
  enrollment_id: number
  course: Course
  paid: boolean
  payment_due: string
  status: string
}

interface AttendanceRecord {
  attendance_id: number
  course_id: number
  attendance_date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  course_title: string
}

interface Assignment {
  assignment_id: number
  course_id: number
  title: string
  description: string
  due_date: string
  max_points: number
  course_title: string
}

interface Material {
  material_id: number
  course_id: number
  title: string
  type: string
  url: string
  description: string
  upload_date: string
  course_title: string
}

export default function StudentDashboard() {
  const router = useRouter()
  const { user, userType } = useAuthStore()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([])
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([])
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([])
  const [attendanceStats, setAttendanceStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance'>('overview')
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

  // Type guard to check if user is a student
  const isStudent = (user: any): user is { student_id: number; name: string; email: string } => {
    return user && userType === 'student' && 'student_id' in user
  }

  useEffect(() => {
    if (isStudent(user)) {
      fetchDashboardData()
    }
  }, [user, userType])

  const fetchDashboardData = async () => {
    if (!isStudent(user)) return
    
    try {
      setLoading(true)
      
      // Fetch enrolled courses with enrollment details
      const enrollmentsData = await apiClient.get('/api/v1/courses/my-enrollments')
      setEnrollments(enrollmentsData)

      // Fetch attendance stats
      const statsData = await apiClient.getAttendanceStats(user.student_id)
      setAttendanceStats(statsData)

      // Fetch recent attendance
      const attendanceData = await apiClient.getStudentAttendance(user.student_id)
      setRecentAttendance(attendanceData.slice(0, 5)) // Last 5 records

      // Fetch assignments and materials from backend
      try {
        const assignmentsData = await apiClient.get(`/api/v1/students/assignments/upcoming?student_id=${user.student_id}`)
        setUpcomingAssignments(assignmentsData)
      } catch (error) {
        console.log('Assignments endpoint not implemented yet, using empty array')
        setUpcomingAssignments([])
      }

      try {
        const materialsData = await apiClient.get(`/api/v1/students/materials/recent?student_id=${user.student_id}`)
        setRecentMaterials(materialsData)
      } catch (error) {
        console.log('Materials endpoint not implemented yet, using empty array')
        setRecentMaterials([])
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'late': return 'bg-yellow-100 text-yellow-800'
      case 'excused': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const handleShowQRCode = async () => {
    if (!isStudent(user)) return
    
    try {
      // Fetch fresh user data to get QR code
      const userData = await apiClient.get('/api/v1/auth/me')
      const qrCode = userData.user.qr_code
      
      if (qrCode) {
        setQrCodeUrl(qrCode)
        setShowQRModal(true)
      } else {
        alert('QR code not available. Please contact administration.')
      }
    } catch (error) {
      console.error('Error fetching QR code:', error)
      alert('Failed to load QR code')
    }
  }

  if (userType !== 'student') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">This page is only accessible to students.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your courses today.</p>
        </div>

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`${
              activeTab === 'attendance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
          >
            Monthly Attendance Report
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'attendance' && isStudent(user) ? (
        <MonthlyAttendanceReport studentId={user.student_id} />
      ) : (
        <>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
            <p className="text-xs text-muted-foreground">
              Active enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceStats ? `${attendanceStats.attendance_percentage?.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall attendance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAssignments.length}</div>
            <p className="text-xs text-muted-foreground">
              Due this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceStats ? attendanceStats.total_classes : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Classes attended
            </p>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Section */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">My QR Code</h3>
                  <p className="text-sm text-gray-600">Click to view your attendance QR code</p>
                </div>
              </div>
              <Button 
                onClick={handleShowQRCode}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <QrCode className="h-4 w-4 mr-2" />
                View QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Courses
            </CardTitle>
            <CardDescription>Your current course enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <div 
                    key={enrollment.enrollment_id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/courses/${enrollment.course.course_id}`)}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold">{enrollment.course.title}</h4>
                      <p className="text-sm text-gray-600">{enrollment.course.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(enrollment.course.start_time)} - {formatTime(enrollment.course.end_time)}
                        </span>
                        {enrollment.course.is_online ? (
                          <Badge variant="secondary">Online</Badge>
                        ) : (
                          <span>{enrollment.course.location}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(enrollment.course.status)}>
                        {enrollment.course.status}
                      </Badge>
                      {!enrollment.paid && (
                        <Badge variant="destructive">Payment Due</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No courses enrolled yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Attendance
            </CardTitle>
            <CardDescription>Your latest attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttendance.length > 0 ? (
                recentAttendance.map((record) => (
                  <div key={record.attendance_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{record.course_title}</p>
                      <p className="text-sm text-gray-600">{formatDate(record.attendance_date)}</p>
                    </div>
                    <Badge className={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No attendance records yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upcoming Assignments
            </CardTitle>
            <CardDescription>Assignments due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAssignments.map((assignment) => (
                <div key={assignment.assignment_id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{assignment.title}</h4>
                      <p className="text-sm text-gray-600">{assignment.course_title}</p>
                      <p className="text-xs text-gray-500 mt-1">{assignment.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Due: {formatDate(assignment.due_date)}</p>
                      <p className="text-xs text-gray-500">{assignment.max_points} pts</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Materials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Recent Materials
            </CardTitle>
            <CardDescription>Newly uploaded course materials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMaterials.map((material) => (
                <div key={material.material_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{material.title}</h4>
                    <p className="text-sm text-gray-600">{material.course_title}</p>
                    <p className="text-xs text-gray-500">{material.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Uploaded: {formatDate(material.upload_date)}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrCodeUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="text-center">
              <div className="mb-4">
                <QrCode className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-gray-900">My QR Code</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Show this QR code to mark your attendance
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                <img 
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${qrCodeUrl}`}
                  alt="Student QR Code" 
                  className="w-64 h-64 object-contain cursor-pointer hover:scale-105 transition-transform"
                  onError={(e) => {
                    console.error('Failed to load QR code image');
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%236b7280" font-size="16">QR Code Not Available</text></svg>';
                  }}
                />
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                <p>Student ID: {isStudent(user) ? user.student_id : 'N/A'}</p>
                <p className="mt-1">Name: {user?.name}</p>
              </div>

              <Button
                onClick={() => setShowQRModal(false)}
                className="mt-6 w-full"
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AuthenticatedLayout>
  )
}