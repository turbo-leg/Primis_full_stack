import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { AuthToken, LoginCredentials, RegisterData } from '@/types'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('user_data')
          window.location.href = '/login'
        }
        
        // Log detailed error information for debugging
        console.error('API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
          method: error.config?.method,
        })
        
        // Pass through the full error object for better error handling in components
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    const response = await this.client.post('/api/v1/auth/login', credentials)
    return response.data
  }

  async register(data: RegisterData): Promise<any> {
    const response = await this.client.post('/api/v1/auth/register/student', data)
    return response.data
  }

  async getCurrentUser(): Promise<any> {
    const response = await this.client.get('/api/v1/auth/me')
    return response.data
  }

  async logout(): Promise<void> {
    await this.client.post('/api/v1/auth/logout')
  }

  // Course endpoints
  async getCourses(params?: any): Promise<any> {
    const response = await this.client.get('/api/v1/courses', { params })
    return response.data
  }

  async getCourse(id: number): Promise<any> {
    const response = await this.client.get(`/api/v1/courses/${id}`)
    return response.data
  }

  async createCourse(data: any): Promise<any> {
    const response = await this.client.post('/api/v1/courses', data)
    return response.data
  }

  async updateCourse(id: number, data: any): Promise<any> {
    const response = await this.client.put(`/api/v1/courses/${id}`, data)
    return response.data
  }

  async deleteCourse(id: number): Promise<void> {
    await this.client.delete(`/api/v1/courses/${id}`)
  }

  async enrollInCourse(courseId: number): Promise<any> {
    const response = await this.client.post(`/api/v1/courses/${courseId}/enroll`)
    return response.data
  }

  async getMyCourses(): Promise<any> {
    const response = await this.client.get('/api/v1/courses/my-courses')
    return response.data
  }

  // Attendance endpoints
  async markAttendance(data: any): Promise<any> {
    const response = await this.client.post('/api/v1/attendance/mark', data)
    return response.data
  }

  async scanQRAttendance(data: any): Promise<any> {
    const response = await this.client.post('/api/v1/attendance/scan-qr', data)
    return response.data
  }

  async getCourseAttendance(courseId: number, date?: string): Promise<any> {
    const params = date ? { attendance_date: date } : {}
    const response = await this.client.get(`/api/v1/attendance/course/${courseId}`, { params })
    return response.data
  }

  async getStudentAttendance(studentId: number, courseId?: number): Promise<any> {
    const params = courseId ? { course_id: courseId } : {}
    const response = await this.client.get(`/api/v1/attendance/student/${studentId}`, { params })
    return response.data
  }

  async getAttendanceStats(studentId: number, courseId?: number): Promise<any> {
    const params = courseId ? { course_id: courseId } : {}
    const response = await this.client.get(`/api/v1/attendance/student/${studentId}/stats`, { params })
    return response.data
  }

  async getMonthlyAttendanceReport(studentId: number, year?: number, month?: number): Promise<any> {
    const params: any = {}
    if (year) params.year = year
    if (month) params.month = month
    const response = await this.client.get(`/api/v1/attendance/student/${studentId}/monthly-report`, { params })
    return response.data
  }

  async generateAttendanceQR(courseId: number, date: string): Promise<any> {
    const response = await this.client.get(`/api/v1/attendance/generate-qr/${courseId}`, {
      params: { class_date: date }
    })
    return response.data
  }

  // Generic methods
  async get(url: string, params?: any): Promise<any> {
    const response = await this.client.get(url, { params })
    return response.data
  }

  async post(url: string, data?: any): Promise<any> {
    try {
      const response = await this.client.post(url, data)
      return response.data
    } catch (error: any) {
      // Pass through the full error with response data for components to handle
      throw error
    }
  }

  async put(url: string, data?: any): Promise<any> {
    const response = await this.client.put(url, data)
    return response.data
  }

  async delete(url: string): Promise<void> {
    await this.client.delete(url)
  }
}

export const apiClient = new ApiClient()