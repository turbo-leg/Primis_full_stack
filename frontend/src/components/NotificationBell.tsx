'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react'
import { useNotificationCount, useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/hooks/useNotifications'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

// Simple time ago formatter
const formatDistanceToNow = (date: Date, locale: string) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const locale = useLocale()

  const { data: countData } = useNotificationCount()
  const { data: notifications, isLoading } = useNotifications(showUnreadOnly)
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const deleteNotification = useDeleteNotification()

  const unreadCount = countData?.unread_count || 0

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNotificationClick = (notification: any) => {
    // Mark as read if unread
    if (!notification.is_read) {
      markAsRead.mutate(notification.notification_id)
    }

    // Navigate if has action URL
    if (notification.action_url) {
      router.push(notification.action_url)
      setIsOpen(false)
    }
  }

  const handleDelete = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation()
    deleteNotification.mutate(notificationId)
  }

  const handleMarkAllRead = () => {
    markAllAsRead.mutate()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400'
      case 'high': return 'text-orange-600 dark:text-orange-400'
      case 'medium': return 'text-blue-600 dark:text-blue-400'
      case 'low': return 'text-gray-600 dark:text-gray-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'high': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
      case 'medium': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      default: return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowUnreadOnly(false)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  !showUnreadOnly
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setShowUnreadOnly(true)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  showUnreadOnly
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Mark all as read */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Loading notifications...
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Priority indicator */}
                      <div className={`flex-shrink-0 w-1 rounded-full ${
                        notification.priority === 'urgent' ? 'bg-red-500' :
                        notification.priority === 'high' ? 'bg-orange-500' :
                        notification.priority === 'medium' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`} />

                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm font-semibold ${
                            !notification.is_read 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>

                        {/* Message */}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Action button */}
                        {notification.action_text && (
                          <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                            {notification.action_text} →
                          </button>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), locale)}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead.mutate(notification.notification_id)
                                }}
                                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(e, notification.notification_id)}
                              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <button
                onClick={() => {
                  router.push('/dashboard/notifications')
                  setIsOpen(false)
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
