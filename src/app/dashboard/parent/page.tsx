'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  User, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle,
  MessageSquare,
  Calendar,
  Download,
  Eye,
  BarChart3,
  TrendingUp,
  Clock
} from 'lucide-react';

interface Child {
  student_id: number;
  name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  qr_code?: string;
}

interface Course {
  course_id: number;
  title: string;
  description: string;
  teacher_name: string;
  grade?: number;
  attendance_percentage?: number;
  total_assignments?: number;
  completed_assignments?: number;
}

interface Assignment {
  assignment_id: number;
  title: string;
  course_title: string;
  due_date: string;
  status: 'submitted' | 'pending' | 'overdue' | 'graded';
  grade?: number;
  max_points?: number;
  feedback?: string;
  submitted_at?: string;
}

interface Attendance {
  date: string;
  status: 'present' | 'absent' | 'late';
  course_title: string;
}

interface Message {
  message_id: number;
  from_name: string;
  subject: string;
  preview: string;
  date: string;
  is_read: boolean;
}

interface PerformanceData {
  month: string;
  average_grade: number;
  attendance_rate: number;
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildData();
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const parentId = localStorage.getItem('user_id');
      const response = await fetch(`http://localhost:8000/api/parents/${parentId}/children`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch children');
      const data = await response.json();
      setChildren(data);
      if (data.length > 0) {
        setSelectedChild(data[0]);
      }
    } catch (err) {
      setError('Failed to load children data');
      console.error(err);
    }
  };

  const fetchChildData = async () => {
    if (!selectedChild) return;
    
    setLoading(true);
    try {
      // Fetch courses
      const coursesRes = await fetch(
        `http://localhost:8000/api/students/${selectedChild.student_id}/courses`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (coursesRes.ok) {
        setCourses(await coursesRes.json());
      }

      // Fetch assignments
      const assignmentsRes = await fetch(
        `http://localhost:8000/api/students/${selectedChild.student_id}/assignments`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (assignmentsRes.ok) {
        setAssignments(await assignmentsRes.json());
      }

      // Fetch attendance
      const attendanceRes = await fetch(
        `http://localhost:8000/api/students/${selectedChild.student_id}/attendance`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (attendanceRes.ok) {
        setAttendance(await attendanceRes.json());
      }

      // Mock messages for now (would come from real API)
      setMessages([
        {
          message_id: 1,
          from_name: 'Ms. Smith',
          subject: 'Your child is doing great!',
          preview: 'I wanted to reach out to inform you that your child has been excelling...',
          date: '2025-10-19',
          is_read: true,
        },
        {
          message_id: 2,
          from_name: 'Mr. Johnson',
          subject: 'Missing Assignment',
          preview: 'I noticed that your child has not submitted the latest math assignment...',
          date: '2025-10-18',
          is_read: false,
        },
      ]);

      // Mock performance data
      setPerformanceData([
        { month: 'August', average_grade: 78, attendance_rate: 92 },
        { month: 'September', average_grade: 82, attendance_rate: 94 },
        { month: 'October', average_grade: 85, attendance_rate: 96 },
      ]);
    } catch (err) {
      console.error('Error fetching child data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600';
      case 'absent':
        return 'text-red-600';
      case 'late':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const overallAttendance = attendance.length > 0 
    ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
    : 0;

  const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'overdue').length;

  const averageGrade = assignments.filter(a => a.grade).length > 0
    ? Math.round(
        assignments
          .filter(a => a.grade)
          .reduce((sum, a) => sum + ((a.grade || 0) / (a.max_points || 100)) * 100, 0) /
        assignments.filter(a => a.grade).length
      )
    : 0;

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="w-5 h-5" />
              <p className="font-semibold">{error}</p>
            </div>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Parent Dashboard</h1>
          <p className="text-gray-600">Monitor your child's progress and stay connected</p>
        </div>

        {/* Child Selector */}
        <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
          {children.map((child) => (
            <Button
              key={child.student_id}
              onClick={() => setSelectedChild(child)}
              variant={selectedChild?.student_id === child.student_id ? 'default' : 'outline'}
              className="whitespace-nowrap"
            >
              <User className="w-4 h-4 mr-2" />
              {child.name}
            </Button>
          ))}
        </div>

        {selectedChild && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Average Grade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{averageGrade}%</div>
                  <p className="text-xs text-gray-500 mt-1">Based on graded assignments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{overallAttendance}%</div>
                  <p className="text-xs text-gray-500 mt-1">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{courses.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Enrolled courses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{pendingAssignments}</div>
                  <p className="text-xs text-gray-500 mt-1">Assignments to submit</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Performance Chart */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Performance Trend
                      </CardTitle>
                      <CardDescription>Grade and attendance over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {performanceData.map((data, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{data.month}</span>
                              <div className="flex gap-4">
                                <span className="text-blue-600">Grade: {data.average_grade}%</span>
                                <span className="text-green-600">Attendance: {data.attendance_rate}%</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${data.average_grade}%` }}
                                ></div>
                              </div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${data.attendance_rate}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Current GPA</p>
                        <p className="text-3xl font-bold text-blue-600">{(averageGrade / 20).toFixed(1)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Assignments Completed</p>
                        <p className="text-3xl font-bold text-green-600">
                          {assignments.filter(a => a.status === 'graded').length}/{assignments.length}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Attendance Days</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {attendance.filter(a => a.status === 'present').length}/{attendance.length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Courses Tab */}
              <TabsContent value="courses">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loading ? (
                    <Card className="md:col-span-3">
                      <CardContent className="pt-6">
                        <p className="text-gray-500">Loading courses...</p>
                      </CardContent>
                    </Card>
                  ) : courses.length > 0 ? (
                    courses.map((course) => (
                      <Card key={course.course_id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {course.teacher_name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-gray-600">{course.description}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Overall Grade</span>
                              <span className="font-semibold text-blue-600">{course.grade}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Attendance</span>
                              <span className="font-semibold text-green-600">{course.attendance_percentage}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Assignments</span>
                              <span className="font-semibold">
                                {course.completed_assignments}/{course.total_assignments}
                              </span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="md:col-span-3">
                      <CardContent className="pt-6">
                        <p className="text-gray-500">No courses found</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Assignments Tab */}
              <TabsContent value="assignments">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Assignment Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {assignments.length > 0 ? (
                        assignments.map((assignment) => (
                          <div
                            key={assignment.assignment_id}
                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                                <p className="text-sm text-gray-600">{assignment.course_title}</p>
                              </div>
                              <Badge className={getAssignmentStatusColor(assignment.status)}>
                                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                              <div className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-4 h-4" />
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                              </div>
                              {assignment.status === 'graded' && assignment.grade !== undefined && (
                                <div className="text-blue-600 font-semibold">
                                  Grade: {assignment.grade}/{assignment.max_points}
                                </div>
                              )}
                              {assignment.submitted_at && (
                                <div className="text-gray-600">
                                  Submitted: {new Date(assignment.submitted_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>

                            {assignment.feedback && (
                              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-2">
                                <p className="text-sm">
                                  <span className="font-semibold">Feedback:</span> {assignment.feedback}
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No assignments found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Attendance Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {attendance.length > 0 ? (
                        attendance.slice(-20).reverse().map((record, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-3 border rounded hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{record.course_title}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(record.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className={`font-semibold ${getAttendanceColor(record.status)}`}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No attendance records found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Messages from Teachers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {messages.length > 0 ? (
                        messages.map((message) => (
                          <div
                            key={message.message_id}
                            className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                              !message.is_read ? 'bg-blue-50 border-blue-300' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                  {message.from_name}
                                  {!message.is_read && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  )}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {new Date(message.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p className="font-medium text-gray-900 mb-2">{message.subject}</p>
                            <p className="text-sm text-gray-600">{message.preview}</p>
                            <Button variant="ghost" size="sm" className="mt-2">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Reply
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No messages</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
