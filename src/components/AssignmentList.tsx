'use client'

import React, { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ChevronRight, Plus } from 'lucide-react'

interface Assignment {
  assignment_id: number
  course_id: number
  course_title: string
  title: string
  description: string
  due_date: string
  max_points: number
  submissions_count?: number
  submission_status?: 'pending' | 'submitted' | 'overdue'
  grade?: number
}

interface AssignmentListProps {
  type: 'student' | 'teacher'
  courseId?: number
  onSelectAssignment?: (assignment: Assignment) => void
  onCreateAssignment?: () => void
}

export default function AssignmentList({
  type,
  courseId,
  onSelectAssignment,
  onCreateAssignment
}: AssignmentListProps) {
  const locale = useLocale()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'overdue'>('all')

  useEffect(() => {
    fetchAssignments()
  }, [type, courseId, filter])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      setError(null)

      let endpoint = ''
      if (type === 'student') {
        endpoint = `/api/students/${courseId ? `assignments?course_id=${courseId}` : 'assignments/upcoming'}`
      } else {
        endpoint = `/api/teachers/assignments${courseId ? `?course_id=${courseId}` : ''}`
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${endpoint}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch assignments')
      }

      let data = await response.json()
      
      // Filter based on status if student view
      if (type === 'student' && filter !== 'all') {
        data = data.filter((a: Assignment) => a.submission_status === filter)
      }

      setAssignments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments')
      setAssignments([])
    } finally {
      setLoading(false)
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getGradeColor = (grade: number | undefined, maxPoints?: number) => {
    if (!grade || !maxPoints) return 'text-gray-600'
    const percentage = (grade / maxPoints) * 100
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {type === 'student' ? 'My Assignments' : 'Assignments'}
            </CardTitle>
            <CardDescription>
              {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
            </CardDescription>
          </div>
          {type === 'teacher' && onCreateAssignment && (
            <Button onClick={onCreateAssignment} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Assignment
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-800 mb-4">
            {error}
          </div>
        )}

        {/* Filter Tabs (Student Only) */}
        {type === 'student' && (
          <div className="mb-6 flex gap-2 border-b border-gray-200 pb-3">
            {(['all', 'pending', 'submitted', 'overdue'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors capitalize ${
                  filter === filterOption
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filterOption}
              </button>
            ))}
          </div>
        )}

        {/* Assignments List */}
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filter === 'all' ? 'No assignments yet' : `No ${filter} assignments`}
            </div>
          ) : (
            assignments.map((assignment) => (
              <button
                key={assignment.assignment_id}
                onClick={() => onSelectAssignment?.(assignment)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {assignment.title}
                      </h3>
                      {type === 'student' && assignment.grade !== undefined && (
                        <Badge className={`${getGradeColor(assignment.grade, assignment.max_points)} ml-auto`}>
                          {assignment.grade}/{assignment.max_points}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {assignment.course_title}
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                      {assignment.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Due: {formatDate(assignment.due_date)}
                      </span>
                      <span>
                        Max: {assignment.max_points} pts
                      </span>
                      {type === 'teacher' && assignment.submissions_count !== undefined && (
                        <span>
                          Submissions: {assignment.submissions_count}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {type === 'student' && (
                      <Badge className={getStatusColor(assignment.submission_status)}>
                        {assignment.submission_status}
                      </Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
