'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { 
  BookOpen, 
  Calendar, 
  MapPin, 
  Users,
  FileText,
  Bell,
  Upload,
  Download,
  Trash2,
  AlertCircle,
  GraduationCap
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
}

interface Material {
  material_id: number
  course_id: number
  title: string
  type: string
  url: string
  file_size: number
  description: string
  is_public: boolean
  upload_date: string
}

interface Announcement {
  announcement_id: number
  course_id: number
  title: string
  content: string
  posted_on: string
  is_important: boolean
  posted_by_id: number
  posted_by_type: string
}

interface Teacher {
  teacher_id: number
  name: string
  email: string
  specialization?: string
  role: string
}

interface Student {
  student_id: number
  name: string
  email: string
  phone?: string
  role: string
  enrollment_date?: string
  paid: boolean
}

interface CoursePeople {
  teachers: Teacher[]
  students: Student[]
  total_teachers: number
  total_students: number
}

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = parseInt(params.id as string)
  const { user, userType } = useAuthStore()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [people, setPeople] = useState<CoursePeople | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'announcements' | 'people'>('overview')
  
  // Material upload state
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
  // Announcement creation state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      console.log('Fetching course data for courseId:', courseId)
      console.log('Current user:', user, 'UserType:', userType)
      
      const [courseData, materialsData, announcementsData, peopleData] = await Promise.all([
        apiClient.get(`/api/v1/courses/${courseId}`),
        apiClient.get(`/api/v1/courses/${courseId}/materials`),
        apiClient.get(`/api/v1/courses/${courseId}/announcements`),
        apiClient.get(`/api/v1/courses/${courseId}/people`)
      ])
      
      console.log('Course data loaded:', courseData)
      setCourse(courseData)
      setMaterials(materialsData)
      setAnnouncements(announcementsData)
      setPeople(peopleData)
    } catch (error: any) {
      console.error('Error fetching course data:', error)
      console.error('Error response:', error.response?.data)
      alert(`Failed to load course data: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile || !uploadTitle) {
      alert('Please provide a title and select a file')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', uploadTitle)
      if (uploadDescription) {
        formData.append('description', uploadDescription)
      }
      formData.append('is_public', 'false')

      const response = await fetch(`http://localhost:8000/api/v1/courses/${courseId}/materials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      })

      if (response.ok) {
        alert('Material uploaded successfully!')
        setUploadTitle('')
        setUploadDescription('')
        setUploadFile(null)
        setShowUploadForm(false)
        fetchCourseData()
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.detail}`)
      }
    } catch (error) {
      console.error('Error uploading material:', error)
      alert('Failed to upload material')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm('Are you sure you want to delete this material?')) return

    try {
      await apiClient.delete(`/api/v1/materials/${materialId}`)
      alert('Material deleted successfully!')
      fetchCourseData()
    } catch (error) {
      console.error('Error deleting material:', error)
      alert('Failed to delete material')
    }
  }

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!announcementTitle || !announcementContent) {
      alert('Please provide a title and content')
      return
    }

    try {
      setPosting(true)
      await apiClient.post(`/api/v1/courses/${courseId}/announcements`, {
        title: announcementTitle,
        content: announcementContent,
        is_important: isImportant
      })

      alert('Announcement posted successfully!')
      setAnnouncementTitle('')
      setAnnouncementContent('')
      setIsImportant(false)
      setShowAnnouncementForm(false)
      fetchCourseData()
    } catch (error) {
      console.error('Error posting announcement:', error)
      alert('Failed to post announcement')
    } finally {
      setPosting(false)
    }
  }

  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      await apiClient.delete(`/api/v1/announcements/${announcementId}`)
      alert('Announcement deleted successfully!')
      fetchCourseData()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert('Failed to delete announcement')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const isTeacher = userType === 'teacher'
  const isAdmin = userType === 'admin'
  const canManage = isTeacher || isAdmin

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading course...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (!course) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl text-gray-600">Course not found</p>
            <Button onClick={() => router.push('/courses')} className="mt-4">
              Back to Courses
            </Button>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mb-4"
          >
            ← Back
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(course.start_time)}
              </span>
              <span className="flex items-center gap-1">
                {course.is_online ? (
                  <>
                    <BookOpen className="h-4 w-4" />
                    Online
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    {course.location}
                  </>
                )}
              </span>
              <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                {course.status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">${course.price}</p>
            <p className="text-sm text-gray-600">
              <Users className="inline h-4 w-4 mr-1" />
              Max {course.max_students} students
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="inline h-4 w-4 mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`pb-4 px-2 font-medium ${
              activeTab === 'materials'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="inline h-4 w-4 mr-2" />
            Materials ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`pb-4 px-2 font-medium ${
              activeTab === 'announcements'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell className="inline h-4 w-4 mr-2" />
            Announcements ({announcements.length})
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`pb-4 px-2 font-medium ${
              activeTab === 'people'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="inline h-4 w-4 mr-2" />
            People ({(people?.total_teachers || 0) + (people?.total_students || 0)})
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(course.start_time)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">End Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(course.end_time)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Price</dt>
                  <dd className="mt-1 text-sm text-gray-900">${course.price}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Maximum Students</dt>
                  <dd className="mt-1 text-sm text-gray-900">{course.max_students}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Format</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {course.is_online ? 'Online' : 'In-Person'}
                  </dd>
                </div>
                {!course.is_online && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">{course.location}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Material</CardTitle>
                <CardDescription>Share files and resources with students</CardDescription>
              </CardHeader>
              <CardContent>
                {!showUploadForm ? (
                  <Button onClick={() => setShowUploadForm(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                ) : (
                  <form onSubmit={handleUploadMaterial} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title *</label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">File *</label>
                      <input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Upload'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowUploadForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {materials.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                No materials uploaded yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {materials.map((material) => (
                <Card key={material.material_id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{material.title}</h3>
                        {material.description && (
                          <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="capitalize">{material.type}</span>
                          <span>{formatFileSize(material.file_size)}</span>
                          <span>{formatDate(material.upload_date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`http://localhost:8000${material.url}`, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        {canManage && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteMaterial(material.material_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Post Announcement</CardTitle>
                <CardDescription>Share updates and important information</CardDescription>
              </CardHeader>
              <CardContent>
                {!showAnnouncementForm ? (
                  <Button onClick={() => setShowAnnouncementForm(true)}>
                    <Bell className="h-4 w-4 mr-2" />
                    New Announcement
                  </Button>
                ) : (
                  <form onSubmit={handlePostAnnouncement} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title *</label>
                      <input
                        type="text"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Content *</label>
                      <textarea
                        value={announcementContent}
                        onChange={(e) => setAnnouncementContent(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={5}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="important"
                        checked={isImportant}
                        onChange={(e) => setIsImportant(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="important" className="text-sm font-medium">
                        Mark as important
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={posting}>
                        {posting ? 'Posting...' : 'Post Announcement'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowAnnouncementForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {announcements.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                No announcements yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <Card key={announcement.announcement_id} className={announcement.is_important ? 'border-red-300 bg-red-50' : ''}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {announcement.is_important && (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                          <h3 className="font-medium text-lg">{announcement.title}</h3>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap mb-2">{announcement.content}</p>
                        <p className="text-sm text-gray-500">
                          Posted by {announcement.posted_by_type} on {formatDate(announcement.posted_on)}
                        </p>
                      </div>
                      {canManage && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteAnnouncement(announcement.announcement_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* People Tab */}
      {activeTab === 'people' && (
        <div className="space-y-6">
          {/* Teachers Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Teachers ({people?.total_teachers || 0})
              </CardTitle>
              <CardDescription>Instructors for this course</CardDescription>
            </CardHeader>
            <CardContent>
              {!people || people.teachers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No teachers assigned yet</p>
              ) : (
                <div className="space-y-3">
                  {people.teachers.map((teacher) => (
                    <div key={teacher.teacher_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {teacher.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{teacher.name}</h4>
                          <p className="text-sm text-gray-600">{teacher.email}</p>
                          {teacher.specialization && (
                            <p className="text-xs text-gray-500 mt-1">
                              Specialization: {teacher.specialization}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {teacher.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students ({people?.total_students || 0})
              </CardTitle>
              <CardDescription>Enrolled students in this course</CardDescription>
            </CardHeader>
            <CardContent>
              {!people || people.students.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No students enrolled yet</p>
              ) : (
                <div className="space-y-3">
                  {people.students.map((student) => (
                    <div key={student.student_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 font-semibold text-lg">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{student.name}</h4>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          {student.phone && (
                            <p className="text-xs text-gray-500 mt-1">
                              Phone: {student.phone}
                            </p>
                          )}
                          {student.enrollment_date && (
                            <p className="text-xs text-gray-400 mt-1">
                              Enrolled: {formatDate(student.enrollment_date)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {student.role}
                        </Badge>
                        {student.paid ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                            Payment Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </AuthenticatedLayout>
  )
}
