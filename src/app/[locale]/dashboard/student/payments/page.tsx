'use client'

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { DollarSign, CreditCard } from 'lucide-react'

export default function StudentPaymentsPage() {
  const t = useTranslations()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        // Fetch student's payments
        const response = await apiClient.get(`/api/v1/payments/student/${user?.id}`)
        setPayments(response.data || [])
      } catch (error) {
        console.error('Failed to fetch payments:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchPayments()
    }
  }, [user?.id])

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>{t('common.loading')}</p>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('payments.myPayments')}</h1>
          <p className="text-gray-500">{t('payments.trackYourPayments')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{t('payments.totalPaid')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">$0.00</div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{t('payments.outstanding')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">$0.00</div>
                <CreditCard className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('payments.history')}</CardTitle>
            <CardDescription>{t('payments.yourPaymentHistory')}</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-center py-8 text-gray-500">{t('payments.noPayments')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">{t('payments.course')}</th>
                      <th className="text-left py-2 px-4">{t('payments.amount')}</th>
                      <th className="text-left py-2 px-4">{t('payments.status')}</th>
                      <th className="text-left py-2 px-4">{t('common.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment: any) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{payment.course_name}</td>
                        <td className="py-2 px-4">${payment.amount}</td>
                        <td className="py-2 px-4">
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-4">{new Date(payment.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button size="lg">{t('payments.makePayment')}</Button>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
