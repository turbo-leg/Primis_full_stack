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
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText, 
  TrendingUp,
  UserCheck,
  GraduationCap,
  BarChart3,
  Plus,
  Edit,
  Eye
} from 'lucide-react'

interface Course {
  course_id: number
  title: string
  description: string
  start_time: string
  end_time: string
  price: number
  max_students: number
  is_online: boolean
  location: string
  status: string
  created_at: string
  enrolled_count?: number
}

interface Student {
  student_id: number
  name: string
  email: string
  phone?: string
  attendance_rate?: number
  last_login?: string
}

interface AttendanceRecord {
  attendance_id: number
  student_id: number
  course_id: number
  attendance_date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  student_name: string
  course_title: string
}

interface Assignment {
  assignment_id: number
  course_id: number
  title: string
  description: string
  due_date: string
  max_points: number
  submissions_count?: number
  course_title: string
}

export default function TeacherDashboard() {
  const { user, userType } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Type guard to check if user is a teacher
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
      
      // Fetch teacher's courses
      const coursesData = await apiClient.get('/api/v1/courses/my-courses')
      setCourses(coursesData)

      // Get all students from teacher's courses
      if (coursesData.length > 0) {
        const allStudents: Student[] = []
        for (const course of coursesData) {
          try {
            const courseStudents = await apiClient.get(`/api/v1/courses/${course.course_id}/students`)
            allStudents.push(...courseStudents)
          } catch (error) {
            console.log(`Could not fetch students for course ${course.course_id}`)
          }
        }
        // Remove duplicates based on student_id
        const uniqueStudents = allStudents.filter((student, index, self) => 
          index === self.findIndex(s => s.student_id === student.student_id)
        )
        setStudents(uniqueStudents)

        // Fetch recent attendance for teacher's courses
        try {
          const attendanceData = await apiClient.get(`/api/v1/teachers/attendance/recent?teacher_id=${user.teacher_id}`)
          setRecentAttendance(attendanceData.slice(0, 10))
        } catch (error) {
          console.log('Recent attendance endpoint not available')
          setRecentAttendance([])
        }

        // Fetch assignments for teacher's courses
        try {
          const assignmentsData = await apiClient.get(`/api/v1/teachers/assignments?teacher_id=${user.teacher_id}`)
          setAssignments(assignmentsData)
        } catch (error) {
          console.log('Teacher assignments endpoint not available')
          setAssignments([])
        }
      }

      // Calculate stats
      const totalStudents = students.length
      const totalCourses = coursesData.length
      const activeStudents = students.filter(s => s.last_login && 
        new Date(s.last_login) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
      const averageAttendance = students.reduce((acc, s) => acc + (s.attendance_rate || 0), 0) / students.length || 0

      setStats({
        totalStudents,
        totalCourses,
        activeStudents,
        averageAttendance: Math.round(averageAttendance)
      })

    } catch (error) {
      console.error('Error fetching teacher dashboard data:', error)
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

  const generateAttendanceQR = async (courseId: number) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const qrData = await apiClient.generateAttendanceQR(courseId, today)
      // TODO: Show QR code in a modal
      alert(`QR Code generated for attendance. QR Data: ${JSON.stringify(qrData)}`)
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('Error generating QR code')
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, {user?.name}! Manage your courses and students.</p>
          </div>
          <Button 
            onClick={() => window.location.href = '/attendance/take'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Take Attendance
          </Button>
        </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageAttendance || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Class attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Courses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  My Courses
                </CardTitle>
                <CardDescription>Courses you're teaching</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <div key={course.course_id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{course.title}</h4>
                        <p className="text-sm text-gray-600">{course.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(course.start_time)} - {formatTime(course.end_time)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {course.enrolled_count || 0}/{course.max_students}
                          </span>
                          {course.is_online ? (
                            <Badge variant="secondary">Online</Badge>
                          ) : (
                            <span>{course.location}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(course.status)}>
                          {course.status}
                        </Badge>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => generateAttendanceQR(course.course_id)}>
                            QR
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No courses assigned yet.</p>
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
            <CardDescription>Latest attendance records from your classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttendance.length > 0 ? (
                recentAttendance.map((record) => (
                  <div key={record.attendance_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{record.student_name}</p>
                      <p className="text-sm text-gray-600">{record.course_title}</p>
                      <p className="text-xs text-gray-500">{formatDate(record.attendance_date)}</p>
                    </div>
                    <Badge className={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No recent attendance records.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              My Students
            </CardTitle>
            <CardDescription>Students enrolled in your courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.length > 0 ? (
                students.slice(0, 8).map((student) => (
                  <div key={student.student_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{student.name}</h4>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      {student.phone && (
                        <p className="text-xs text-gray-500">{student.phone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {student.attendance_rate !== undefined && (
                        <p className="text-sm font-medium">{student.attendance_rate}% attendance</p>
                      )}
                      {student.last_login && (
                        <p className="text-xs text-gray-500">
                          Last: {formatDate(student.last_login)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No students enrolled yet.</p>
              )}
              {students.length > 8 && (
                <Button variant="outline" className="w-full mt-4">
                  View All Students ({students.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Assignments
                </CardTitle>
                <CardDescription>Assignments for your courses</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </div>
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
                        <p className="text-sm font-medium">Due: {formatDate(assignment.due_date)}</p>
                        <p className="text-xs text-gray-500">
                          {assignment.submissions_count || 0} submissions
                        </p>
                        <p className="text-xs text-gray-500">{assignment.max_points} pts</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No assignments created yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AuthenticatedLayout>
  )
}