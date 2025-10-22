'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
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
  const t = useTranslations()
  const locale = useLocale()
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
      alert(t('courseDetails.errors.loadFailed', { message: error.response?.data?.detail || error.message }))
    } finally {
      setLoading(false)
    }
  }

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile || !uploadTitle) {
      alert(t('courseDetails.materials.errors.titleAndFileRequired'))
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
        alert(t('courseDetails.materials.success.uploaded'))
        setUploadTitle('')
        setUploadDescription('')
        setUploadFile(null)
        setShowUploadForm(false)
        fetchCourseData()
      } else {
        const error = await response.json()
        alert(t('courseDetails.materials.errors.uploadFailed', { detail: error.detail }))
      }
    } catch (error) {
      console.error('Error uploading material:', error)
      alert(t('courseDetails.materials.errors.uploadFailed', { detail: '' }))
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm(t('courseDetails.materials.confirmDelete'))) return

    try {
      await apiClient.delete(`/api/v1/materials/${materialId}`)
      alert(t('courseDetails.materials.success.deleted'))
      fetchCourseData()
    } catch (error) {
      console.error('Error deleting material:', error)
      alert(t('courseDetails.materials.errors.deleteFailed'))
    }
  }

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!announcementTitle || !announcementContent) {
      alert(t('courseDetails.announcements.errors.titleAndContentRequired'))
      return
    }

    try {
      setPosting(true)
      await apiClient.post(`/api/v1/courses/${courseId}/announcements`, {
        title: announcementTitle,
        content: announcementContent,
        is_important: isImportant
      })

      alert(t('courseDetails.announcements.success.posted'))
      setAnnouncementTitle('')
      setAnnouncementContent('')
      setIsImportant(false)
      setShowAnnouncementForm(false)
      fetchCourseData()
    } catch (error) {
      console.error('Error posting announcement:', error)
      alert(t('courseDetails.announcements.errors.postFailed'))
    } finally {
      setPosting(false)
    }
  }

  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (!confirm(t('courseDetails.announcements.confirmDelete'))) return

    try {
      await apiClient.delete(`/api/v1/announcements/${announcementId}`)
      alert(t('courseDetails.announcements.success.deleted'))
      fetchCourseData()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert(t('courseDetails.announcements.errors.deleteFailed'))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
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
            <p className="mt-4 text-gray-600">{t('courseDetails.loading')}</p>
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
            <p className="text-xl text-gray-600">{t('courseDetails.notFound')}</p>
            <Button onClick={() => router.push('/courses')} className="mt-4">
              {t('courseDetails.backToCourses')}
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
            ← {t('common.back')}
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
                    {t('courses.badges.online')}
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
              {t('courseDetails.maxStudents', { max: course.max_students })}
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
            {t('courseDetails.tabs.overview')}
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
            {t('courseDetails.tabs.materials', { count: materials.length })}
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
            {t('courseDetails.tabs.announcements', { count: announcements.length })}
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
            {t('courseDetails.tabs.people', { count: (people?.total_teachers || 0) + (people?.total_students || 0) })}
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('courseDetails.overview.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('courseDetails.overview.details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t('courseDetails.overview.startDate')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(course.start_time)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t('courseDetails.overview.endDate')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(course.end_time)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t('courses.price')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">${course.price}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t('courseDetails.overview.maximumStudents')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{course.max_students}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t('courseDetails.overview.format')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {course.is_online ? t('courses.badges.online') : t('courses.badges.inPerson')}
                  </dd>
                </div>
                {!course.is_online && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('courseDetails.overview.location')}</dt>
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
                <CardTitle>{t('courseDetails.materials.uploadTitle')}</CardTitle>
                <CardDescription>{t('courseDetails.materials.uploadDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {!showUploadForm ? (
                  <Button onClick={() => setShowUploadForm(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    {t('courseDetails.materials.uploadFile')}
                  </Button>
                ) : (
                  <form onSubmit={handleUploadMaterial} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('courseDetails.materials.form.title')} *</label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('courseDetails.materials.form.description')}</label>
                      <textarea
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('courseDetails.materials.form.file')} *</label>
                      <input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={uploading}>
                        {uploading ? t('courseDetails.materials.uploading') : t('courseDetails.materials.upload')}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowUploadForm(false)}
                      >
                        {t('common.cancel')}
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
                {t('courseDetails.materials.noMaterials')}
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
                          {t('courseDetails.materials.download')}
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
                <CardTitle>{t('courseDetails.announcements.postTitle')}</CardTitle>
                <CardDescription>{t('courseDetails.announcements.postDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {!showAnnouncementForm ? (
                  <Button onClick={() => setShowAnnouncementForm(true)}>
                    <Bell className="h-4 w-4 mr-2" />
                    {t('courseDetails.announcements.newAnnouncement')}
                  </Button>
                ) : (
                  <form onSubmit={handlePostAnnouncement} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('courseDetails.announcements.form.title')} *</label>
                      <input
                        type="text"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('courseDetails.announcements.form.content')} *</label>
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
                        {t('courseDetails.announcements.form.markImportant')}
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={posting}>
                        {posting ? t('courseDetails.announcements.posting') : t('courseDetails.announcements.post')}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowAnnouncementForm(false)}
                      >
                        {t('common.cancel')}
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
                {t('courseDetails.announcements.noAnnouncements')}
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
                          {t('courseDetails.announcements.postedBy', { 
                            type: announcement.posted_by_type,
                            date: formatDate(announcement.posted_on)
                          })}
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
                {t('courseDetails.people.teachers', { count: people?.total_teachers || 0 })}
              </CardTitle>
              <CardDescription>{t('courseDetails.people.teachersDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!people || people.teachers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">{t('courseDetails.people.noTeachers')}</p>
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
                              {t('courseDetails.people.specialization')}: {teacher.specialization}
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
                {t('courseDetails.people.students', { count: people?.total_students || 0 })}
              </CardTitle>
              <CardDescription>{t('courseDetails.people.studentsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!people || people.students.length === 0 ? (
                <p className="text-gray-500 text-center py-4">{t('courseDetails.people.noStudents')}</p>
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
                              {t('courseDetails.people.phone')}: {student.phone}
                            </p>
                          )}
                          {student.enrollment_date && (
                            <p className="text-xs text-gray-400 mt-1">
                              {t('courseDetails.people.enrolled')}: {formatDate(student.enrollment_date)}
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
                            {t('courseDetails.people.paid')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                            {t('courseDetails.people.paymentPending')}
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
