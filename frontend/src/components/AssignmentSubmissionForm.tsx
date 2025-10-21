'use client'

import React, { useState, useRef } from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, File, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface AssignmentSubmissionFormProps {
  assignmentId: number
  assignmentTitle: string
  dueDate: string
  maxPoints: number
  instructions?: string
  onSubmitSuccess?: () => void
}

export default function AssignmentSubmissionForm({
  assignmentId,
  assignmentTitle,
  dueDate,
  maxPoints,
  instructions,
  onSubmitSuccess
}: AssignmentSubmissionFormProps) {
  const locale = useLocale()
  const [submissionText, setSubmissionText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isOverdue = new Date(dueDate) < new Date()
  const formattedDueDate = new Date(dueDate).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB')
        return
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
    
    if (!submissionText.trim() && !selectedFile) {
      setError('Please provide either submission text or a file')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      
      if (submissionText.trim()) {
        formData.append('submission_text', submissionText.trim())
      }
      
      if (selectedFile) {
        formData.append('file', selectedFile)
      }

      // Make API call
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/students/assignments/${assignmentId}/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to submit assignment')
      }

      setSubmitted(true)
      setSubmissionText('')
      setSelectedFile(null)
      
      if (onSubmitSuccess) {
        onSubmitSuccess()
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        setSubmitted(false)
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assignment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={isOverdue ? 'border-red-200 bg-red-50' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Submit Assignment
            </CardTitle>
            <CardDescription className="mt-2">{assignmentTitle}</CardDescription>
          </div>
          {isOverdue && (
            <Badge variant="destructive" className="ml-auto">
              Overdue
            </Badge>
          )}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Due: <span className="font-semibold">{formattedDueDate}</span></p>
          <p>Points: <span className="font-semibold">{maxPoints}</span></p>
        </div>
        {instructions && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-semibold text-blue-900 mb-1">Instructions:</p>
            <p className="text-sm text-blue-800">{instructions}</p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800">
                Assignment submitted successfully! Your teacher will review it soon.
              </p>
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

            {/* Text Submission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Text (Optional)
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => {
                  setSubmissionText(e.target.value)
                  setError(null)
                }}
                placeholder="Enter your answer or response here... You can also attach a file below."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={8}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {submissionText.length} characters
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attach File (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                disabled={loading}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls"
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
                Max file size: 50MB. Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, XLS, XLSX
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || !submissionText.trim() && !selectedFile}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </>
                )}
              </Button>
              {isOverdue && (
                <p className="text-sm text-red-600 flex items-center">
                  ⚠️ This assignment is overdue
                </p>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
