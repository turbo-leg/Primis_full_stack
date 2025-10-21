'use client'

import React, { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Calendar, Award, Loader2 } from 'lucide-react'
import AssignmentSubmissionForm from './AssignmentSubmissionForm'
import AssignmentGrading from './AssignmentGrading'

interface AssignmentDetailsProps {
  assignmentId: number
  courseId?: number
  type: 'student' | 'teacher'
  onBack?: () => void
}

interface AssignmentDetail {
  assignment_id: number
  course_id: number
  course_title: string
  title: string
  description: string
  instructions?: string
  due_date: string
  max_points: number
  created_by_id: number
  created_at: string
  submissions_count?: number
}

export default function AssignmentDetails({
  assignmentId,
  courseId,
  type,
  onBack
}: AssignmentDetailsProps) {
  const locale = useLocale()
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  useEffect(() => {
    fetchAssignmentDetail()
  }, [assignmentId, refetchTrigger])

  const fetchAssignmentDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      // For now, we'll construct the assignment detail from what we know
      // In production, you might fetch from a dedicated endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/assignments/${assignmentId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setAssignment(data)
      } else {
        // Fallback: We'll handle this in the component using props
        setError('Assignment details not available')
      }
    } catch (err) {
      console.log('Could not fetch assignment details, using passed props')
      // This is okay - we can work without full details
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = assignment && new Date(assignment.due_date) < new Date()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {onBack && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      {/* Assignment Details Card */}
      {assignment && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl">{assignment.title}</CardTitle>
                <CardDescription className="mt-1">
                  {assignment.course_title}
                </CardDescription>
              </div>
              {isOverdue && (
                <Badge variant="destructive" className="ml-auto">
                  Overdue
                </Badge>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Due: {formatDate(assignment.due_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Award className="h-4 w-4" />
                <span>Max: {assignment.max_points} points</span>
              </div>
              {type === 'teacher' && assignment.submissions_count !== undefined && (
                <div className="text-gray-600">
                  Submissions: {assignment.submissions_count}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {assignment.description}
              </p>
            </div>

            {/* Instructions */}
            {assignment.instructions && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {assignment.instructions}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Student: Submission Form */}
      {type === 'student' && assignment && (
        <AssignmentSubmissionForm
          assignmentId={assignment.assignment_id}
          assignmentTitle={assignment.title}
          dueDate={assignment.due_date}
          maxPoints={assignment.max_points}
          instructions={assignment.instructions}
          onSubmitSuccess={() => setRefetchTrigger(prev => prev + 1)}
        />
      )}

      {/* Teacher: Grading Interface */}
      {type === 'teacher' && assignment && (
        <AssignmentGrading
          assignmentId={assignment.assignment_id}
          assignmentTitle={assignment.title}
          maxPoints={assignment.max_points}
          dueDate={assignment.due_date}
          onGradeSuccess={() => setRefetchTrigger(prev => prev + 1)}
        />
      )}

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-800">
          {error}
        </div>
      )}
    </div>
  )
}
