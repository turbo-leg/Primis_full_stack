'use client'

import React, { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, CheckCircle, AlertCircle, Send } from 'lucide-react'

interface Submission {
  submission_id: number
  assignment_id: number
  student_id: number
  student_name: string
  submission_text: string | null
  file_url: string | null
  submitted_at: string
  grade: number | null
  feedback: string | null
  graded_at: string | null
  assignment_title: string
}

interface AssignmentGradingProps {
  assignmentId: number
  assignmentTitle: string
  maxPoints: number
  dueDate: string
  onGradeSuccess?: () => void
}

export default function AssignmentGrading({
  assignmentId,
  assignmentTitle,
  maxPoints,
  dueDate,
  onGradeSuccess
}: AssignmentGradingProps) {
  const locale = useLocale()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null)
  const [gradingData, setGradingData] = useState({
    grade: '',
    feedback: ''
  })
  const [gradingLoading, setGradingLoading] = useState(false)
  const [gradeSuccess, setGradeSuccess] = useState(false)

  useEffect(() => {
    fetchSubmissions()
  }, [assignmentId])

  const fetchSubmissions = async () => {
    try {
      setLoadingSubmissions(true)
      setError(null)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teachers/assignments/${assignmentId}/submissions`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }

      const data = await response.json()
      setSubmissions(data)
      if (data.length > 0) {
        setSelectedSubmissionId(data[0].submission_id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions')
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const selectedSubmission = submissions.find(s => s.submission_id === selectedSubmissionId)

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSubmission || !gradingData.grade) {
      setError('Please enter a grade')
      return
    }

    const gradeValue = parseFloat(gradingData.grade)
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > maxPoints) {
      setError(`Grade must be between 0 and ${maxPoints}`)
      return
    }

    setGradingLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teachers/assignments/${assignmentId}/submissions/${selectedSubmission.submission_id}/grade`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            grade: gradeValue,
            feedback: gradingData.feedback || null
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to grade submission')
      }

      setGradeSuccess(true)
      setGradingData({ grade: '', feedback: '' })
      
      // Refresh submissions
      await fetchSubmissions()
      
      if (onGradeSuccess) {
        onGradeSuccess()
      }

      setTimeout(() => setGradeSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grade submission')
    } finally {
      setGradingLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGradePercentage = (grade: number | null) => {
    if (!grade) return null
    return ((grade / maxPoints) * 100).toFixed(1)
  }

  const getGradeColor = (grade: number | null) => {
    if (!grade) return 'bg-gray-100 text-gray-800'
    const percentage = (grade / maxPoints) * 100
    if (percentage >= 90) return 'bg-green-100 text-green-800'
    if (percentage >= 80) return 'bg-blue-100 text-blue-800'
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800'
    if (percentage >= 60) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  if (loadingSubmissions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grade Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grade Submissions</CardTitle>
          <CardDescription>{assignmentTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No submissions yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Submissions List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Submissions ({submissions.length})</CardTitle>
          <CardDescription>{assignmentTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {submissions.map((submission) => (
              <button
                key={submission.submission_id}
                onClick={() => {
                  setSelectedSubmissionId(submission.submission_id)
                  setGradingData({ grade: '', feedback: '' })
                }}
                className={`w-full text-left p-3 border rounded-lg transition-colors ${
                  selectedSubmissionId === submission.submission_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {submission.student_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      ID: {submission.student_id}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(submission.submitted_at)}
                    </p>
                  </div>
                  {submission.grade !== null ? (
                    <Badge className={getGradeColor(submission.grade)}>
                      {submission.grade}/{maxPoints}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100">
                      Not graded
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submission Detail & Grading */}
      {selectedSubmission && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{selectedSubmission.student_name}</CardTitle>
                <CardDescription>
                  Submitted: {formatDate(selectedSubmission.submitted_at)}
                </CardDescription>
              </div>
              {selectedSubmission.grade !== null && (
                <Badge className={getGradeColor(selectedSubmission.grade)}>
                  {selectedSubmission.grade}/{maxPoints} ({getGradePercentage(selectedSubmission.grade)}%)
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {gradeSuccess && (
              <div className="p-4 border border-green-200 bg-green-50 rounded-lg flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-800">Grade submitted successfully!</p>
              </div>
            )}

            {error && (
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Submission Content */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Submission Content</h3>
              <div className="space-y-4">
                {selectedSubmission.submission_text && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 mb-2">TEXT SUBMISSION</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {selectedSubmission.submission_text}
                    </p>
                  </div>
                )}

                {selectedSubmission.file_url && (
                  <a
                    href={selectedSubmission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Download className="h-5 w-5 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-blue-600">FILE ATTACHMENT</p>
                      <p className="text-sm text-blue-800 truncate">
                        {selectedSubmission.file_url.split('/').pop() || 'Download File'}
                      </p>
                    </div>
                    <span className="text-xs text-blue-600 whitespace-nowrap">↗ Open</span>
                  </a>
                )}

                {!selectedSubmission.submission_text && !selectedSubmission.file_url && (
                  <p className="text-sm text-gray-500 italic">No submission content</p>
                )}
              </div>
            </div>

            {/* Grading Form */}
            <form onSubmit={handleGradeSubmit} className="space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade (out of {maxPoints})
                </label>
                <input
                  type="number"
                  min="0"
                  max={maxPoints}
                  step="0.5"
                  value={gradingData.grade}
                  onChange={(e) => {
                    setGradingData({ ...gradingData, grade: e.target.value })
                    setError(null)
                  }}
                  placeholder={`0 - ${maxPoints}`}
                  disabled={gradingLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  value={gradingData.feedback}
                  onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
                  placeholder="Provide constructive feedback for the student..."
                  disabled={gradingLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                disabled={gradingLoading || !gradingData.grade}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {gradingLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting Grade...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Grade
                  </>
                )}
              </Button>
            </form>

            {selectedSubmission.graded_at && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                <p className="font-semibold">Previously graded on {formatDate(selectedSubmission.graded_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
