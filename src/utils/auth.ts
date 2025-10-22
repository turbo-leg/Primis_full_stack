import { UserType } from '@/types'

/**
 * Get the dashboard path for a specific user type
 */
export const getDashboardPath = (userType: UserType): string => {
  switch (userType) {
    case 'student':
      return '/dashboard/student'
    case 'teacher':
      return '/dashboard/teacher'
    case 'admin':
      return '/dashboard/admin'
    case 'parent':
      return '/dashboard/parent'
    default:
      return '/login'
  }
}

/**
 * Get the display name for a user type
 */
export const getUserTypeDisplayName = (userType: UserType): string => {
  switch (userType) {
    case 'student':
      return 'Student'
    case 'teacher':
      return 'Teacher'
    case 'admin':
      return 'Administrator'
    case 'parent':
      return 'Parent'
    default:
      return 'User'
  }
}

/**
 * Check if a user type has administrative privileges
 */
export const hasAdminPrivileges = (userType: UserType): boolean => {
  return userType === 'admin'
}

/**
 * Check if a user type can manage courses
 */
export const canManageCourses = (userType: UserType): boolean => {
  return userType === 'admin' || userType === 'teacher'
}

/**
 * Check if a user type can view student data
 */
export const canViewStudentData = (userType: UserType): boolean => {
  return userType === 'admin' || userType === 'teacher' || userType === 'parent'
}