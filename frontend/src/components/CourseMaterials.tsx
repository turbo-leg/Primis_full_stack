'use client'

import React, { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Image, Video, Link2, Download, Trash2, Eye, EyeOff } from 'lucide-react'

interface Material {
  material_id: number
  course_id: number
  title: string
  type: 'pdf' | 'video' | 'link' | 'document' | 'image'
  url: string
  description: string
  is_public: boolean
  upload_date: string
}

interface CourseMaterialsProps {
  courseId: number
  isTeacher?: boolean
  onMaterialDeleted?: () => void
}

export default function CourseMaterials({
  courseId,
  isTeacher = false,
  onMaterialDeleted
}: CourseMaterialsProps) {
  const locale = useLocale()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    fetchMaterials()
  }, [courseId])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/materials`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch materials')
      }

      const data = await response.json()
      setMaterials(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch materials')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm('Are you sure you want to delete this material?')) {
      return
    }

    setDeleting(materialId)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/materials/${materialId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete material')
      }

      setMaterials(materials.filter(m => m.material_id !== materialId))
      if (onMaterialDeleted) {
        onMaterialDeleted()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete material')
    } finally {
      setDeleting(null)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return <FileText className="h-5 w-5" />
      case 'image':
        return <Image className="h-5 w-5" />
      case 'video':
        return <Video className="h-5 w-5" />
      case 'link':
        return <Link2 className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-100 text-red-800'
      case 'document':
        return 'bg-blue-100 text-blue-800'
      case 'image':
        return 'bg-purple-100 text-purple-800'
      case 'video':
        return 'bg-orange-100 text-orange-800'
      case 'link':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'Download File'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Course Materials
        </CardTitle>
        <CardDescription>
          {materials.length} {materials.length === 1 ? 'material' : 'materials'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-800 mb-4">
            {error}
          </div>
        )}

        {materials.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No materials uploaded yet
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map(material => (
              <div
                key={material.material_id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`p-3 rounded-lg ${getTypeColor(material.type)} flex-shrink-0`}>
                    {getTypeIcon(material.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {material.title}
                      </h3>
                      <Badge className={getTypeColor(material.type)} variant="secondary">
                        {material.type.toUpperCase()}
                      </Badge>
                      {isTeacher && (
                        <Badge variant="outline">
                          {material.is_public ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Public
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Private
                            </>
                          )}
                        </Badge>
                      )}
                    </div>

                    {material.description && (
                      <p className="text-sm text-gray-600 mb-1">
                        {material.description}
                      </p>
                    )}

                    <p className="text-xs text-gray-500">
                      Uploaded: {formatDate(material.upload_date)}
                    </p>

                    {material.type === 'link' && (
                      <p className="text-xs text-blue-600 mt-1 truncate">
                        {material.url}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {material.type === 'link' ? (
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-blue-50 rounded-md transition-colors text-blue-600"
                    >
                      <Link2 className="h-5 w-5" />
                    </a>
                  ) : (
                    <a
                      href={material.url}
                      download
                      className="p-2 hover:bg-blue-50 rounded-md transition-colors text-blue-600"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                  )}

                  {isTeacher && (
                    <button
                      onClick={() => handleDeleteMaterial(material.material_id)}
                      disabled={deleting === material.material_id}
                      className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600 disabled:opacity-50"
                    >
                      {deleting === material.material_id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
