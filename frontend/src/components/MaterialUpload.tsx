'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, File, Loader2, CheckCircle, AlertCircle, X, FileText, Image, Video, Link2 } from 'lucide-react'

interface MaterialUploadProps {
  courseId: number
  onUploadSuccess?: () => void
}

type MaterialType = 'pdf' | 'video' | 'link' | 'document' | 'image'

export default function MaterialUpload({
  courseId,
  onUploadSuccess
}: MaterialUploadProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    materialType: 'document' as MaterialType,
    link: '',
    isPublic: true
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const materialTypes: { value: MaterialType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'document', label: 'Document', icon: FileText },
    { value: 'pdf', label: 'PDF', icon: FileText },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'image', label: 'Image', icon: Image },
    { value: 'link', label: 'Link', icon: Link2 }
  ]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        setError('File size must be less than 500MB')
        return
      }

      // Auto-detect material type based on file extension
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'pdf') {
        setFormData(prev => ({ ...prev, materialType: 'pdf' }))
      } else if (['mp4', 'avi', 'mov', 'mkv'].includes(ext || '')) {
        setFormData(prev => ({ ...prev, materialType: 'video' }))
      } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
        setFormData(prev => ({ ...prev, materialType: 'image' }))
      } else if (['doc', 'docx'].includes(ext || '')) {
        setFormData(prev => ({ ...prev, materialType: 'document' }))
      }

      setSelectedFile(file)
      setError(null)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setError('Please enter a title')
      return
    }

    if (formData.materialType === 'link') {
      if (!formData.link.trim()) {
        setError('Please enter a link URL')
        return
      }
      // Validate URL
      try {
        new URL(formData.link)
      } catch {
        setError('Please enter a valid URL')
        return
      }
    } else if (!selectedFile) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('title', formData.title.trim())
      uploadFormData.append('description', formData.description.trim())
      uploadFormData.append('type', formData.materialType)
      uploadFormData.append('is_public', String(formData.isPublic))

      if (formData.materialType === 'link') {
        uploadFormData.append('url', formData.link)
      } else if (selectedFile) {
        uploadFormData.append('file', selectedFile)
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/materials`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: uploadFormData
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to upload material')
      }

      setUploaded(true)
      setFormData({
        title: '',
        description: '',
        materialType: 'document',
        link: '',
        isPublic: true
      })
      setSelectedFile(null)

      if (onUploadSuccess) {
        onUploadSuccess()
      }

      // Reset success message after 2 seconds
      setTimeout(() => {
        setUploaded(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload material')
    } finally {
      setLoading(false)
    }
  }

  const CurrentTypeIcon = materialTypes.find(t => t.value === formData.materialType)?.icon || FileText

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Course Material
        </CardTitle>
        <CardDescription>Add learning materials to your course</CardDescription>
      </CardHeader>

      <CardContent>
        {uploaded ? (
          <div className="space-y-4">
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800">Material uploaded successfully!</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value })
                  setError(null)
                }}
                placeholder="e.g., Chapter 5 - Introduction to Algorithms"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this material..."
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                rows={3}
              />
            </div>

            {/* Material Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Material Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {materialTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, materialType: type.value })
                      setSelectedFile(null)
                    }}
                    disabled={loading}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-2 text-sm font-medium transition-all ${
                      formData.materialType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    } disabled:opacity-50`}
                  >
                    <type.icon className="h-5 w-5" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* File or Link Input */}
            {formData.materialType === 'link' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL *
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => {
                    setFormData({ ...formData, link: e.target.value })
                    setError(null)
                  }}
                  placeholder="https://example.com/resource"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">{selectedFile.name}</p>
                        <p className="text-xs text-green-700">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={loading}
                      className="p-2 hover:bg-green-100 rounded-md transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4 text-green-600" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600"
                  >
                    <Upload className="h-5 w-5" />
                    Click to upload or drag and drop
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Max file size: 500MB. Supported formats: PDF, DOC, DOCX, MP4, AVI, MOV, JPG, PNG, GIF
                </p>
              </div>
            )}

            {/* Public Toggle */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                disabled={loading}
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="is_public" className="text-sm font-medium text-gray-700 cursor-pointer">
                Make this material visible to students
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !formData.title.trim() || (formData.materialType === 'link' ? !formData.link : !selectedFile)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Material
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
