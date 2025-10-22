'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [apiUrl, setApiUrl] = useState('')
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [loginTest, setLoginTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  }, [])

  const testHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/health`)
      const data = await response.json()
      setHealthStatus({ success: true, status: response.status, data })
    } catch (error: any) {
      setHealthStatus({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@primis.edu', password: 'admin123' })
      })
      const data = await response.json()
      setLoginTest({ success: response.ok, status: response.status, data })
    } catch (error: any) {
      setLoginTest({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-6">Debug Dashboard</h1>

        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h2 className="text-lg font-semibold mb-2">API Configuration</h2>
          <p className="text-sm text-gray-700">
            <strong>API URL:</strong> <code className="bg-gray-100 px-2 py-1">{apiUrl}</code>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This is read from: <code>process.env.NEXT_PUBLIC_API_URL</code>
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={testHealth}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Health Endpoint'}
          </button>

          {healthStatus && (
            <div className={`p-4 rounded ${healthStatus.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className="font-semibold mb-2">Health Check Result:</h3>
              <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            </div>
          )}

          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Login Endpoint'}
          </button>

          {loginTest && (
            <div className={`p-4 rounded ${loginTest.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className="font-semibold mb-2">Login Test Result:</h3>
              <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded">
                {JSON.stringify(loginTest, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded text-sm">
          <h3 className="font-semibold mb-2">Troubleshooting Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-gray-700">
            <li>Check if the API URL is correct above</li>
            <li>Open browser DevTools (F12) → Network tab</li>
            <li>Click the test buttons and watch for failed requests</li>
            <li>Check if there are CORS errors in the Console tab</li>
            <li>Verify the backend is running at {apiUrl}</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
