import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// Query keys for cache management
export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  recentUsers: (limit?: number) => [...adminKeys.users(), 'recent', limit] as const,
  courses: () => [...adminKeys.all, 'courses'] as const,
  payments: () => [...adminKeys.all, 'payments'] as const,
  pendingPayments: (limit?: number) => [...adminKeys.payments(), 'pending', limit] as const,
  activity: () => [...adminKeys.all, 'activity'] as const,
  recentActivity: (limit?: number) => [...adminKeys.activity(), 'recent', limit] as const,
  analytics: () => [...adminKeys.all, 'analytics'] as const,
  revenue: () => [...adminKeys.analytics(), 'revenue'] as const,
  enrollment: () => [...adminKeys.analytics(), 'enrollment'] as const,
  attendance: () => [...adminKeys.analytics(), 'attendance'] as const,
}

// Admin Stats Hook
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => apiClient.get('/api/v1/admin/stats'),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Recent Users Hook
export function useRecentUsers(limit = 10) {
  return useQuery({
    queryKey: adminKeys.recentUsers(limit),
    queryFn: () => apiClient.get(`/api/v1/admin/users/recent?limit=${limit}`),
    staleTime: 60 * 1000, // 1 minute
  })
}

// Pending Payments Hook
export function usePendingPayments(limit = 20) {
  return useQuery({
    queryKey: adminKeys.pendingPayments(limit),
    queryFn: () => apiClient.get(`/api/v1/admin/payments/pending?limit=${limit}`),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Recent Activity Hook
export function useRecentActivity(limit = 20) {
  return useQuery({
    queryKey: adminKeys.recentActivity(limit),
    queryFn: () => apiClient.get(`/api/v1/admin/activity/recent?limit=${limit}`),
    staleTime: 15 * 1000, // 15 seconds - more frequent updates for activity
  })
}

// Revenue Analytics Hook
export function useRevenueAnalytics() {
  return useQuery({
    queryKey: adminKeys.revenue(),
    queryFn: () => apiClient.get('/api/v1/admin/analytics/revenue'),
    staleTime: 5 * 60 * 1000, // 5 minutes - analytics don't change often
  })
}

// Enrollment Analytics Hook
export function useEnrollmentAnalytics() {
  return useQuery({
    queryKey: adminKeys.enrollment(),
    queryFn: () => apiClient.get('/api/v1/admin/analytics/enrollment'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Attendance Analytics Hook
export function useAttendanceAnalytics() {
  return useQuery({
    queryKey: adminKeys.attendance(),
    queryFn: () => apiClient.get('/api/v1/admin/analytics/attendance'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Update User Status Mutation
export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userType, userId, isActive }: { 
      userType: string; 
      userId: number; 
      isActive: boolean 
    }) => 
      apiClient.put(`/api/v1/admin/users/${userType}/${userId}/status`, { is_active: isActive }),
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() })
    },
  })
}

// Delete User Mutation
export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userType, userId }: { userType: string; userId: number }) =>
      apiClient.delete(`/api/v1/admin/users/${userType}/${userId}`),
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() })
    },
  })
}

// Prefetch function for dashboard data
export function usePrefetchAdminDashboard() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: adminKeys.stats(),
      queryFn: () => apiClient.get('/api/v1/admin/stats'),
    })
    queryClient.prefetchQuery({
      queryKey: adminKeys.recentUsers(10),
      queryFn: () => apiClient.get('/api/v1/admin/users/recent?limit=10'),
    })
    queryClient.prefetchQuery({
      queryKey: adminKeys.pendingPayments(20),
      queryFn: () => apiClient.get('/api/v1/admin/payments/pending?limit=20'),
    })
    queryClient.prefetchQuery({
      queryKey: adminKeys.recentActivity(20),
      queryFn: () => apiClient.get('/api/v1/admin/activity/recent?limit=20'),
    })
  }
}
