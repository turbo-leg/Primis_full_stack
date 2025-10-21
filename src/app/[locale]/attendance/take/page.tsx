'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { 
  QrCode,
  UserCheck,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Camera,
  Users,
  Video,
  VideoOff
} from 'lucide-react'

interface Course {
  course_id: number
  title: string
  description: string
  enrolled_count?: number
}

interface Student {
  student_id: number
  name: string
  email: string
  qr_code?: string
}

interface Enrollment {
  enrollment_id: number
  student: Student
  paid: boolean
}

export default function TakeAttendancePage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const { user, userType } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [attendanceMode, setAttendanceMode] = useState<'select' | 'qr' | 'manual' | null>(null)
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [qrScanInput, setQrScanInput] = useState('')
  const [attendanceMarked, setAttendanceMarked] = useState<Set<number>>(new Set())
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isScannerActive, setIsScannerActive] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const scannerRef = useRef<any>(null)
  const qrCodeRegionId = 'qr-reader'

  // Type guard to check if user is a teacher
  const isTeacher = (user: any): user is { teacher_id: number; name: string; email: string } => {
    return user && userType === 'teacher' && 'teacher_id' in user
  }

  useEffect(() => {
    if (isTeacher(user)) {
      fetchCourses()
    }
  }, [user, userType])

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments()
    }
  }, [selectedCourse])

  const fetchCourses = async () => {
    try {
      const coursesData = await apiClient.get('/api/v1/courses/my-courses')
      setCourses(coursesData)
    } catch (error) {
      console.error('Error fetching courses:', error)
      showMessage('error', t('attendance.errors.loadCourses'))
    }
  }

  const fetchEnrollments = async () => {
    if (!selectedCourse) return
    
    try {
      setLoading(true)
      const enrollmentsData = await apiClient.get(`/api/v1/courses/${selectedCourse.course_id}/enrollments`)
      setEnrollments(enrollmentsData)
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      showMessage('error', t('attendance.errors.loadStudents'))
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const startScanner = async () => {
    if (typeof window === 'undefined') return
    
    try {
      // @ts-ignore
      const { Html5Qrcode } = await import('html5-qrcode')
      
      const html5QrCode = new Html5Qrcode(qrCodeRegionId)
      scannerRef.current = html5QrCode

      const qrCodeSuccessCallback = async (decodedText: string) => {
        console.log('QR Code scanned:', decodedText)
        await handleQRCodeScanned(decodedText)
      }

      const config = { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        undefined
      )

      setIsScannerActive(true)
      setScannerError(null)
    } catch (err: any) {
      console.error('Error starting scanner:', err)
      setScannerError(err.message || t('attendance.errors.cameraFailed'))
      showMessage('error', t('attendance.errors.cameraPermissions'))
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && isScannerActive) {
      try {
        await scannerRef.current.stop()
        setIsScannerActive(false)
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const handleQRCodeScanned = async (qrData: string) => {
    if (!selectedCourse) return

    try {
      const response = await apiClient.post('/api/v1/attendance/scan-qr', {
        qr_data: qrData,
        course_id: selectedCourse.course_id,
        attendance_date: attendanceDate
      })

      showMessage('success', response.message)
      
      // Extract student_id from the QR code (format: student_123)
      const studentId = parseInt(qrData.replace('student_', ''))
      setAttendanceMarked(prev => new Set(prev).add(studentId))
      
      // Play success sound
      const audio = new Audio('/success-sound.mp3')
      audio.play().catch(() => {}) // Ignore if sound fails
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || t('attendance.errors.markFailed'))
    }
  }

  const handleQRScan = async () => {
    if (!qrScanInput.trim() || !selectedCourse) return

    await handleQRCodeScanned(qrScanInput)
    setQrScanInput('')
  }

  const handleManualQRScan = async () => {
    if (!qrScanInput.trim() || !selectedCourse) return

    try {
      const response = await apiClient.post('/api/v1/attendance/scan-qr', {
        qr_data: qrScanInput,
        course_id: selectedCourse.course_id,
        attendance_date: attendanceDate
      })

      showMessage('success', response.message)
      setQrScanInput('')
      
      // Extract student_id from the QR code (format: student_123)
      const studentId = parseInt(qrScanInput.replace('student_', ''))
      setAttendanceMarked(prev => new Set(prev).add(studentId))
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || t('attendance.errors.markFailed'))
    }
  }

  const handleManualAttendance = async (studentId: number, status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!selectedCourse) return

    try {
      await apiClient.post('/api/v1/attendance/mark', {
        student_id: studentId,
        course_id: selectedCourse.course_id,
        attendance_date: attendanceDate,
        status: status
      })

      showMessage('success', t('attendance.success.marked', { status }))
      setAttendanceMarked(prev => new Set(prev).add(studentId))
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || t('attendance.errors.markFailed'))
    }
  }

  // Wait for auth to load
  if (!user) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (userType !== 'teacher') {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">{t('common.accessDenied')}</h1>
            <p className="text-gray-600 mt-2">{t('attendance.accessMessage')}</p>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{t('attendance.takeAttendance')}</h1>
          <p className="text-gray-600 mt-2">{t('attendance.takeAttendanceSubtitle')}</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Select Course */}
        {!selectedCourse && (
          <Card>
            <CardHeader>
              <CardTitle>{t('attendance.selectCourse')}</CardTitle>
              <CardDescription>{t('attendance.selectCourseDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.course_id}
                    onClick={() => setSelectedCourse(course)}
                    className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                  >
                    <h3 className="font-semibold text-lg">{course.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {course.enrolled_count || 0} {t('courses.labels.students')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Attendance Mode */}
        {selectedCourse && !attendanceMode && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Selected Course: {selectedCourse.title}</CardTitle>
                <CardDescription>Choose how you want to take attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700 mr-2">Date:</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* QR Code Option (Recommended) */}
                  <div
                    onClick={() => setAttendanceMode('qr')}
                    className="relative p-6 border-2 border-blue-300 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer transition-all group"
                  >
                    <Badge className="absolute top-4 right-4 bg-blue-600">Recommended</Badge>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <QrCode className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">QR Code Scan</h3>
                      <p className="text-sm text-gray-600">
                        Quick and accurate - scan student QR codes to mark attendance automatically
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Fast & Accurate</span>
                      </div>
                    </div>
                  </div>

                  {/* Manual Option */}
                  <div
                    onClick={() => setAttendanceMode('manual')}
                    className="p-6 border-2 border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-all group"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UserCheck className="h-8 w-8 text-gray-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Manual Entry</h3>
                      <p className="text-sm text-gray-600">
                        Mark attendance manually for each student with different status options
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Flexible Options</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setSelectedCourse(null)}
                  className="mt-6"
                >
                  Change Course
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3a: QR Code Scanning */}
        {selectedCourse && attendanceMode === 'qr' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Attendance - {selectedCourse.title}
                </CardTitle>
                <CardDescription>
                  Date: {new Date(attendanceDate).toLocaleDateString(locale, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Camera Scanner Section */}
                <div className="mb-6">
                  {!isScannerActive ? (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-8">
                      <div className="text-center">
                        <Camera className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">Start Camera Scanner</h4>
                        <p className="text-gray-600 mb-6">
                          Click the button below to start scanning QR codes automatically with your camera
                        </p>
                        <Button 
                          onClick={startScanner}
                          className="bg-blue-600 hover:bg-blue-700"
                          size="lg"
                        >
                          <Video className="h-5 w-5 mr-2" />
                          Start Camera
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Video className="h-5 w-5 text-green-600 animate-pulse" />
                          <span className="font-medium text-green-900">Camera is active - Point at student QR codes</span>
                        </div>
                        <Button 
                          onClick={stopScanner}
                          variant="outline"
                          size="sm"
                        >
                          <VideoOff className="h-4 w-4 mr-2" />
                          Stop Camera
                        </Button>
                      </div>

                      {/* QR Scanner Preview */}
                      <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                        <div id={qrCodeRegionId} className="w-full"></div>
                        <div className="absolute top-4 left-4 right-4">
                          <div className="bg-black bg-opacity-70 text-white p-3 rounded-lg text-center">
                            <p className="text-sm">Position the QR code within the frame</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {scannerError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm">{scannerError}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual Input Fallback */}
                <div className="border-t pt-6">
                  <details className="mb-6">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Or enter QR code manually
                    </summary>
                    <div className="mt-4 flex gap-4">
                      <input
                        type="text"
                        placeholder="Enter QR code (e.g., student_123)"
                        value={qrScanInput}
                        onChange={(e) => setQrScanInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualQRScan()}
                        className="flex-1 px-4 py-3 border rounded-md"
                      />
                      <Button 
                        onClick={handleManualQRScan}
                        disabled={!qrScanInput.trim()}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Present
                      </Button>
                    </div>
                  </details>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Attendance Summary</h4>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-900">{attendanceMarked.size}</div>
                      <div className="text-sm text-green-700">Present</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <Users className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{enrollments.length}</div>
                      <div className="text-sm text-gray-700">Total Students</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                      <Clock className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-amber-900">
                        {enrollments.length - attendanceMarked.size}
                      </div>
                      <div className="text-sm text-amber-700">Pending</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700 text-sm mb-3">Students Present:</h5>
                    {enrollments
                      .filter(e => attendanceMarked.has(e.student.student_id))
                      .map(enrollment => (
                        <div key={enrollment.student.student_id} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{enrollment.student.name}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setAttendanceMode(null)}
                  >
                    Change Method
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAttendanceMode('manual')
                    }}
                  >
                    Switch to Manual
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3b: Manual Attendance */}
        {selectedCourse && attendanceMode === 'manual' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Manual Attendance - {selectedCourse.title}
                </CardTitle>
                <CardDescription>
                  Date: {new Date(attendanceDate).toLocaleDateString(locale, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No students enrolled in this course</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <div className="text-sm text-gray-600">Present</div>
                      </div>
                      <div className="text-center">
                        <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                        <div className="text-sm text-gray-600">Absent</div>
                      </div>
                      <div className="text-center">
                        <Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                        <div className="text-sm text-gray-600">Late</div>
                      </div>
                      <div className="text-center">
                        <AlertCircle className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                        <div className="text-sm text-gray-600">Excused</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {enrollments.map((enrollment) => (
                        <div
                          key={enrollment.student.student_id}
                          className={`p-4 border rounded-lg ${
                            attendanceMarked.has(enrollment.student.student_id)
                              ? 'bg-green-50 border-green-300'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {enrollment.student.name}
                              </h4>
                              <p className="text-sm text-gray-600">{enrollment.student.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={attendanceMarked.has(enrollment.student.student_id) ? "default" : "outline"}
                                onClick={() => handleManualAttendance(enrollment.student.student_id, 'present')}
                                disabled={attendanceMarked.has(enrollment.student.student_id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleManualAttendance(enrollment.student.student_id, 'absent')}
                                disabled={attendanceMarked.has(enrollment.student.student_id)}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleManualAttendance(enrollment.student.student_id, 'late')}
                                disabled={attendanceMarked.has(enrollment.student.student_id)}
                              >
                                <Clock className="h-4 w-4 text-amber-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleManualAttendance(enrollment.student.student_id, 'excused')}
                                disabled={attendanceMarked.has(enrollment.student.student_id)}
                              >
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-900">Progress</p>
                          <p className="text-sm text-blue-700">
                            {attendanceMarked.size} of {enrollments.length} students marked
                          </p>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {Math.round((attendanceMarked.size / enrollments.length) * 100)}%
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setAttendanceMode(null)}
                  >
                    Change Method
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAttendanceMode('qr')
                    }}
                  >
                    Switch to QR Scanner
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
