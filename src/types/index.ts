export interface User {
  id: number
  name: string
  email: string
  is_active: boolean
  created_at: string
}

export interface Student extends User {
  student_id: number
  qr_code?: string
  phone?: string
  date_of_birth?: string
  address?: string
  emergency_contact?: string
  emergency_phone?: string
}

export interface Teacher extends User {
  teacher_id: number
  phone?: string
  specialization?: string
  bio?: string
  hire_date?: string
}

export interface Admin extends User {
  admin_id: number
  phone?: string
  role: string
  permissions?: string
}

export interface Parent {
  parent_id: number
  name: string
  email: string
  phone: string
  address?: string
  relationship_to_student?: string
  is_active: boolean
  created_at: string
}

export interface Course {
  course_id: number
  title: string
  description?: string
  start_time: string
  end_time: string
  price: number
  max_students: number
  is_online: boolean
  location?: string
  status: string
  admin_id: number
  created_at: string
  updated_at: string
}

export interface Enrollment {
  enrollment_id: number
  student_id: number
  course_id: number
  paid: boolean
  paid_date?: string
  payment_due?: string
  enrollment_date: string
  status: string
}

export interface Material {
  material_id: number
  course_id: number
  title: string
  type: string
  url: string
  file_size?: number
  description?: string
  is_public: boolean
  upload_date: string
}

export interface Announcement {
  announcement_id: number
  course_id: number
  title: string
  content: string
  posted_on: string
  is_important: boolean
  posted_by_id: number
  posted_by_type: string
}

export interface Assignment {
  assignment_id: number
  course_id: number
  title: string
  description: string
  due_date: string
  max_points: number
  instructions?: string
  created_by_id: number
  created_at: string
  updated_at: string
}

export interface AssignmentSubmission {
  submission_id: number
  assignment_id: number
  student_id: number
  submission_text?: string
  file_url?: string
  submitted_at: string
  grade?: number
  feedback?: string
  graded_at?: string
  graded_by_id?: number
}

export interface Attendance {
  attendance_id: number
  student_id: number
  course_id: number
  attendance_date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  scanned_at?: string
  notes?: string
  marked_by_id?: number
}

export interface AttendanceStats {
  total_classes: number
  present_count: number
  absent_count: number
  late_count: number
  excused_count: number
  attendance_percentage: number
}

export interface Payment {
  payment_id: number
  enrollment_id: number
  amount: number
  payment_method: string
  payment_status: string
  transaction_id?: string
  payment_date: string
  notes?: string
  processed_by_id?: number
}

export interface CalendarEvent {
  event_id: number
  title: string
  description?: string
  start_time: string
  end_time: string
  event_type: string
  location?: string
  is_recurring: boolean
  recurrence_pattern?: string
  created_by_id: number
  created_by_type: string
  student_id?: number
  teacher_id?: number
  course_id?: number
  created_at: string
  updated_at: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  user_type: string
  user_id: number
  name: string
  email: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
  parent_email?: string
  parent_phone?: string
  date_of_birth?: string
  address?: string
  emergency_contact?: string
  emergency_phone?: string
}

export type UserType = 'student' | 'teacher' | 'admin' | 'parent'

export interface DashboardStats {
  totalStudents?: number
  totalTeachers?: number
  totalCourses?: number
  totalRevenue?: number
  attendanceRate?: number
  enrollmentRate?: number
  activeUsers?: number
  pendingPayments?: number
}

export interface RevenueData {
  month: string
  revenue: number
  enrollments: number
}

export interface NotificationData {
  id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
  read: boolean
}