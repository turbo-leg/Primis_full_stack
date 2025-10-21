'use client'

import React, { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification, Notification } from '@/hooks/useNotifications'
import { Bell, Check, CheckCheck, Trash2, Filter, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  
  const router = useRouter()
  const locale = useLocale()
  const { data: notifications, isLoading } = useNotifications(showUnreadOnly)
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const deleteNotification = useDeleteNotification()

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.notification_id)
    }
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'medium': return <Info className="w-5 h-5 text-blue-500" />
      default: return <Bell className="w-5 h-5 text-gray-400" />
    }
  }

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filteredNotifications = notifications?.filter(n => 
    !filterPriority || n.priority === filterPriority
  )

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with your latest activities and announcements
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 dark:bg-primis-navy-light dark:border-white/10">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Read/Unread Filter */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowUnreadOnly(false)}
                  variant={!showUnreadOnly ? 'default' : 'outline'}
                  size="sm"
                  className={!showUnreadOnly ? 'bg-primis-navy dark:bg-primis-navy-dark' : ''}
                >
                  All
                </Button>
                <Button
                  onClick={() => setShowUnreadOnly(true)}
                  variant={showUnreadOnly ? 'default' : 'outline'}
                  size="sm"
                  className={showUnreadOnly ? 'bg-primis-navy dark:bg-primis-navy-dark' : ''}
                >
                  Unread ({unreadCount})
                </Button>
              </div>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />

              {/* Priority Filter */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilterPriority(null)}
                  variant={!filterPriority ? 'default' : 'outline'}
                  size="sm"
                  className={!filterPriority ? 'bg-primis-navy dark:bg-primis-navy-dark' : ''}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  All
                </Button>
                <Button
                  onClick={() => setFilterPriority('urgent')}
                  variant={filterPriority === 'urgent' ? 'default' : 'outline'}
                  size="sm"
                  className={filterPriority === 'urgent' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Urgent
                </Button>
                <Button
                  onClick={() => setFilterPriority('high')}
                  variant={filterPriority === 'high' ? 'default' : 'outline'}
                  size="sm"
                  className={filterPriority === 'high' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  High
                </Button>
              </div>

              <div className="ml-auto">
                {unreadCount > 0 && (
                  <Button
                    onClick={() => markAllAsRead.mutate()}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 dark:text-blue-400"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Mark all as read
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : !filteredNotifications || filteredNotifications.length === 0 ? (
          <Card className="dark:bg-primis-navy-light dark:border-white/10">
            <CardContent className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No notifications
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {showUnreadOnly 
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.notification_id}
                className={`cursor-pointer transition-all hover:shadow-lg dark:border-white/10 ${
                  !notification.is_read 
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' 
                    : 'dark:bg-primis-navy-light border-l-4 border-l-transparent'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Priority Icon */}
                    <div className="flex-shrink-0 pt-1">
                      {getPriorityIcon(notification.priority)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold ${
                            !notification.is_read 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h3>
                          <Badge className={`text-xs ${getPriorityBadgeClass(notification.priority)}`}>
                            {notification.priority}
                          </Badge>
                        </div>
                        {!notification.is_read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {notification.message}
                      </p>

                      {notification.action_text && (
                        <div className="mb-3">
                          <Button
                            variant="link"
                            className="h-auto p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            {notification.action_text} →
                          </Button>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead.mutate(notification.notification_id)
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-8 text-gray-600 dark:text-gray-400"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Mark read
                            </Button>
                          )}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification.mutate(notification.notification_id)
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-8 text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
