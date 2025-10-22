import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface Notification {
  notification_id: number
  notification_type: string
  title: string
  message: string
  priority: string
  action_url: string | null
  action_text: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
  related_course_id: number | null
  related_assignment_id: number | null
}

export interface NotificationCount {
  unread_count: number
  total_count: number
}

export interface NotificationPreference {
  preference_id: number
  notification_type: string
  in_app_enabled: boolean
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
}

// Get notifications
export function useNotifications(unreadOnly: boolean = false) {
  return useQuery<Notification[]>({
    queryKey: ['notifications', unreadOnly],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/notifications', {
        params: { unread_only: unreadOnly, limit: 50 }
      })
      return response
    },
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000
  })
}

// Get notification count
export function useNotificationCount() {
  return useQuery<NotificationCount>({
    queryKey: ['notificationCount'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/notifications/count')
      return response
    },
    refetchInterval: 15000, // Poll every 15 seconds for count
    staleTime: 5000
  })
}

// Mark notification as read
export function useMarkAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (notificationId: number) => {
      return apiClient.put(`/api/v1/notifications/${notificationId}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] })
    }
  })
}

// Mark all as read
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      return apiClient.put('/api/v1/notifications/read-all')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] })
    }
  })
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (notificationId: number) => {
      return apiClient.delete(`/api/v1/notifications/${notificationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] })
    }
  })
}

// Get notification preferences
export function useNotificationPreferences() {
  return useQuery<NotificationPreference[]>({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/notifications/preferences')
      return response
    }
  })
}

// Update notification preference
export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      notification_type: string
      in_app_enabled?: boolean
      email_enabled?: boolean
      sms_enabled?: boolean
      push_enabled?: boolean
    }) => {
      return apiClient.put('/api/v1/notifications/preferences', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] })
    }
  })
}
