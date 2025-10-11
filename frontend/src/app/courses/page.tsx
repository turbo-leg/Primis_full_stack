'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { 
  BookOpen, 
  Calendar, 
  MapPin,
  DollarSign,
  Users,
  CheckCircle,
  Globe,
  Loader2
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
  enrolled_count?: number
  teacher_ids?: number[]
}

export default function CoursesPage() {
  const { user, userType, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'online' | 'in-person'>('all')

  useEffect(() => {
    // Wait a bit for auth to hydrate from localStorage
    const checkAuth = () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }
      fetchCourses()
      if (userType === 'student') {
        fetchEnrolledCourses()
      }
    }
    
    checkAuth()
  }, [userType, router])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const data = await apiClient.get('/api/v1/courses')
      setCourses(data.filter((c: Course) => c.status === 'active'))
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      alert('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrolledCourses = async () => {
    try {
      const enrollments = await apiClient.get('/api/v1/courses/my-courses')
      const enrolledIds = new Set<number>(enrollments.map((e: any) => e.course_id))
      setEnrolledCourseIds(enrolledIds)
    } catch (error) {
      console.error('Failed to fetch enrolled courses:', error)
    }
  }

  const handleEnroll = async (courseId: number) => {
    if (userType !== 'student') {
      alert('Only students can enroll in courses')
      return
    }

    try {
      setEnrollingCourseId(courseId)
      await apiClient.post(`/api/v1/courses/${courseId}/enroll`)
      alert('Successfully enrolled in course!')
      const newEnrolledIds = new Set(enrolledCourseIds)
      newEnrolledIds.add(courseId)
      setEnrolledCourseIds(newEnrolledIds)
      fetchCourses() // Refresh to update enrolled count
    } catch (error: any) {
      console.error('Failed to enroll:', error)
      alert(error.response?.data?.detail || 'Failed to enroll in course')
    } finally {
      setEnrollingCourseId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const filteredCourses = courses.filter(course => {
    if (filter === 'online') return course.is_online
    if (filter === 'in-person') return !course.is_online
    return true
  })

  const isCourseFull = (course: Course) => {
    return course.enrolled_count !== undefined && course.enrolled_count >= course.max_students
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
          <h1 className="text-3xl font-bold text-gray-900">Available Courses</h1>
          <p className="text-gray-600 mt-2">
            Browse and enroll in courses to start your learning journey
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Courses
          </Button>
          <Button
            variant={filter === 'online' ? 'default' : 'outline'}
          onClick={() => setFilter('online')}
        >
          <Globe className="h-4 w-4 mr-2" />
          Online
        </Button>
        <Button
          variant={filter === 'in-person' ? 'default' : 'outline'}
          onClick={() => setFilter('in-person')}
        >
          <MapPin className="h-4 w-4 mr-2" />
          In-Person
        </Button>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses available</h3>
            <p className="text-gray-600">Check back later for new courses</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.course_id)
            const isFull = isCourseFull(course)
            const canEnroll = userType === 'student' && !isEnrolled && !isFull

            return (
              <Card key={course.course_id} className="flex flex-col">
                <CardHeader className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/courses/${course.course_id}`)}>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={course.is_online ? 'default' : 'secondary'}>
                      {course.is_online ? (
                        <>
                          <Globe className="h-3 w-3 mr-1" />
                          Online
                        </>
                      ) : (
                        <>
                          <MapPin className="h-3 w-3 mr-1" />
                          In-Person
                        </>
                      )}
                    </Badge>
                    {isEnrolled && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enrolled
                      </Badge>
                    )}
                    {isFull && !isEnrolled && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Full
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-3 mb-4 flex-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {formatDate(course.start_time)} - {formatDate(course.end_time)}
                      </span>
                    </div>
                    
                    {!course.is_online && course.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{course.location}</span>
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {course.enrolled_count || 0} / {course.max_students} students
                      </span>
                    </div>

                    <div className="flex items-center text-sm font-semibold text-gray-900">
                      <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                      <span>{formatCurrency(course.price)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => router.push(`/courses/${course.course_id}`)}
                      variant="outline"
                      className="w-full"
                    >
                      View Details
                    </Button>
                    
                    {userType === 'student' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEnroll(course.course_id)
                        }}
                        disabled={!canEnroll || enrollingCourseId === course.course_id}
                        className="w-full"
                        variant={isEnrolled ? 'outline' : 'default'}
                      >
                        {enrollingCourseId === course.course_id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enrolling...
                          </>
                        ) : isEnrolled ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Enrolled
                          </>
                        ) : isFull ? (
                          'Course Full'
                        ) : (
                          'Enroll Now'
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      </div>
    </AuthenticatedLayout>
  )
}
