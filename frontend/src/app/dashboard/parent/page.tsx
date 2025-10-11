'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import MonthlyAttendanceReport from '@/components/MonthlyAttendanceReport'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  TrendingUp,
  BookOpen,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react'

interface Student {
  student_id: number
  name: string
  email: string
  phone?: string
  date_of_birth?: string
  address?: string
  qr_code?: string
}

interface Course {
  course_id: number
  title: string
  description: string
  start_time: string
  end_time: string
  is_online: boolean
  location: string
  status: string
  teacher_name?: string
}

interface Enrollment {
  enrollment_id: number
  course: Course
  paid: boolean
  payment_due: string
  status: string
  amount?: number
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
  submission_status?: 'submitted' | 'pending' | 'overdue'
  grade?: number
}

export default function ParentDashboard() {
  const { user, userType } = useAuthStore()
  const [children, setChildren] = useState<Student[]>([])
  const [selectedChild, setSelectedChild] = useState<Student | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [attendanceStats, setAttendanceStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance'>('overview')

  // Type guard to check if user is a parent
  const isParent = (user: any): user is { parent_id: number; name: string; email: string } => {
    return user && userType === 'parent' && 'parent_id' in user
  }

  useEffect(() => {
    if (isParent(user)) {
      fetchDashboardData()
    }
  }, [user, userType])

  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild.student_id)
    }
  }, [selectedChild])

  const fetchDashboardData = async () => {
    if (!isParent(user)) return
    
    try {
      setLoading(true)
      
      // Fetch parent's children
      try {
        const childrenData = await apiClient.get(`/api/v1/parents/${user.parent_id}/children`)
        setChildren(childrenData)
        if (childrenData.length > 0) {
          setSelectedChild(childrenData[0])
        }
      } catch (error) {
        console.log('Children endpoint not available, using mock data')
        // Mock children data for development
        const mockChildren: Student[] = [
          {
            student_id: 1,
            name: "Alex Johnson",
            email: "alex.johnson@email.com",
            phone: "555-0123",
            date_of_birth: "2008-03-15",
            address: "123 Main St, City, State"
          }
        ]
        setChildren(mockChildren)
        setSelectedChild(mockChildren[0])
      }

    } catch (error) {
      console.error('Error fetching parent dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChildData = async (studentId: number) => {
    try {
      // Fetch child's enrollments
      try {
        const enrollmentsData = await apiClient.get(`/api/v1/students/${studentId}/enrollments`)
        setEnrollments(enrollmentsData)
      } catch (error) {
        console.log('Student enrollments endpoint not available')
        setEnrollments([])
      }

      // Fetch child's attendance
      try {
        const attendanceData = await apiClient.getStudentAttendance(studentId)
        setAttendance(attendanceData.slice(0, 10)) // Last 10 records
        
        const statsData = await apiClient.getAttendanceStats(studentId)
        setAttendanceStats(statsData)
      } catch (error) {
        console.log('Student attendance endpoint not available')
        setAttendance([])
        setAttendanceStats(null)
      }

      // Fetch child's assignments
      try {
        const assignmentsData = await apiClient.get(`/api/v1/students/assignments/upcoming?student_id=${studentId}`)
        setAssignments(assignmentsData)
      } catch (error) {
        console.log('Student assignments endpoint not available, using mock data')
        // Mock assignments for development
        setAssignments([
          {
            assignment_id: 1,
            course_id: 1,
            title: "Math Homework Chapter 5",
            description: "Complete exercises 1-20",
            due_date: "2025-10-05T23:59:00",
            max_points: 100,
            course_title: "Advanced Mathematics",
            submission_status: "submitted",
            grade: 85
          },
          {
            assignment_id: 2,
            course_id: 2,
            title: "Physics Lab Report",
            description: "Submit lab report for experiment 3",
            due_date: "2025-10-03T17:00:00",
            max_points: 50,
            course_title: "Physics Fundamentals",
            submission_status: "pending"
          }
        ])
      }

    } catch (error) {
      console.error('Error fetching child data:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'late': return 'bg-yellow-100 text-yellow-800'
      case 'excused': return 'bg-blue-100 text-blue-800'
      case 'submitted': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'unpaid': return 'bg-red-100 text-red-800'
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (userType !== 'parent') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">This page is only accessible to parents.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}! Monitor your child's progress.</p>
        </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Child</CardTitle>
            <CardDescription>Choose which child's information to view</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {children.map((child) => (
                <Button
                  key={child.student_id}
                  variant={selectedChild?.student_id === child.student_id ? "default" : "outline"}
                  onClick={() => setSelectedChild(child)}
                >
                  {child.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Tabs */}
      {selectedChild && (
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
      )}

      {selectedChild && activeTab === 'attendance' ? (
        <MonthlyAttendanceReport studentId={selectedChild.student_id} />
      ) : selectedChild ? (
        <>
          {/* Student Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedChild.name}'s Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedChild.email}</p>
                  </div>
                </div>
                {selectedChild.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{selectedChild.phone}</p>
                    </div>
                  </div>
                )}
                {selectedChild.date_of_birth && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="font-medium">{formatDate(selectedChild.date_of_birth)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <div className="text-2xl font-bold">
                  {assignments.filter(a => a.submission_status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Due this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unpaid Fees</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enrollments.filter(e => !e.paid).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Outstanding payments
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Enrollments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Enrollments
                </CardTitle>
                <CardDescription>Current course enrollments and payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrollments.length > 0 ? (
                    enrollments.map((enrollment) => (
                      <div key={enrollment.enrollment_id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{enrollment.course.title}</h4>
                            <p className="text-sm text-gray-600">{enrollment.course.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(enrollment.course.start_time)} - {formatTime(enrollment.course.end_time)}
                              </span>
                              {enrollment.course.teacher_name && (
                                <span>Teacher: {enrollment.course.teacher_name}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(enrollment.paid ? 'paid' : 'unpaid')}>
                              {enrollment.paid ? 'Paid' : 'Unpaid'}
                            </Badge>
                            {!enrollment.paid && enrollment.payment_due && (
                              <p className="text-xs text-red-600">
                                Due: {formatDate(enrollment.payment_due)}
                              </p>
                            )}
                            {enrollment.amount && (
                              <p className="text-sm font-medium">
                                {formatCurrency(enrollment.amount)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No course enrollments.</p>
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
                <CardDescription>Latest attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendance.length > 0 ? (
                    attendance.map((record) => (
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

            {/* Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Assignments
                </CardTitle>
                <CardDescription>Assignment status and grades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignments.length > 0 ? (
                    assignments.map((assignment) => (
                      <div key={assignment.assignment_id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-sm text-gray-600">{assignment.course_title}</p>
                            <p className="text-xs text-gray-500 mt-1">{assignment.description}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(assignment.submission_status || 'pending')}>
                              {assignment.submission_status || 'pending'}
                            </Badge>
                            <p className="text-sm font-medium mt-1">
                              Due: {formatDate(assignment.due_date)}
                            </p>
                            {assignment.grade !== undefined && (
                              <p className="text-sm font-medium text-green-600">
                                Grade: {assignment.grade}/{assignment.max_points}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No assignments yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Communication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Communication
                </CardTitle>
                <CardDescription>Contact teachers and school administration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Teachers
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                  <Button className="w-full" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    View Progress Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Children Found</h3>
            <p className="text-gray-600">
              No children are associated with your parent account. Please contact the school administration.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
    </AuthenticatedLayout>
  )
}