'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface CourseReport {
  course_id: number
  course_title: string
  total_classes: number
  present: number
  absent: number
  late: number
  excused: number
  attendance_percentage: number
  records: Array<{
    date: string
    status: string
    notes?: string
  }>
}

interface MonthlyReport {
  student_id: number
  student_name: string
  parent_email: string
  parent_phone: string
  year: number
  month: number
  overall_stats: {
    total_classes: number
    present: number
    absent: number
    late: number
    excused: number
    attendance_percentage: number
  }
  by_course: CourseReport[]
}

export default function MonthlyAttendanceReport({ studentId }: { studentId: number }) {
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const { user } = useAuthStore()

  const fetchReport = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getMonthlyAttendanceReport(studentId, selectedYear, selectedMonth)
      setReport(data)
    } catch (error) {
      console.error('Failed to fetch attendance report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [studentId, selectedYear, selectedMonth])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Loading attendance report...</div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="p-8 text-center text-gray-600">
        No attendance data available
      </div>
    )
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'late': return 'bg-yellow-100 text-yellow-800'
      case 'excused': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Monthly Attendance Report</h2>
            <p className="text-gray-600 mt-1">{report.student_name}</p>
            {user && (
              <div className="text-sm text-gray-500 mt-2">
                <div>Parent Email: {report.parent_email}</div>
                <div>Parent Phone: {report.parent_phone}</div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2023, 2024, 2025].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{report.overall_stats.total_classes}</div>
            <div className="text-sm text-gray-600">Total Classes</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{report.overall_stats.present}</div>
            <div className="text-sm text-gray-600">Present</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{report.overall_stats.absent}</div>
            <div className="text-sm text-gray-600">Absent</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{report.overall_stats.late}</div>
            <div className="text-sm text-gray-600">Late</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{report.overall_stats.attendance_percentage}%</div>
            <div className="text-sm text-gray-600">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* By Course */}
      {report.by_course.length > 0 ? (
        <div className="space-y-4">
          {report.by_course.map((course) => (
            <div key={course.course_id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{course.course_title}</h3>
                  <p className="text-sm text-gray-600">
                    {course.total_classes} classes • {course.attendance_percentage}% attendance
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Present: {course.present}
                  </span>
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                    Absent: {course.absent}
                  </span>
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                    Late: {course.late}
                  </span>
                </div>
              </div>

              {/* Attendance Records */}
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Attendance Records</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {course.records.map((record, index) => (
                    <div
                      key={`${course.course_id}-${record.date}-${index}`}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-gray-700">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded capitalize ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
          No attendance records for {months[selectedMonth - 1]} {selectedYear}
        </div>
      )}
    </div>
  )
}
