'use client'

import { useEffect } from 'react'

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Log page load performance
      window.addEventListener('load', () => {
        const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (perfData) {
          const pageLoadTime = perfData.loadEventEnd - perfData.fetchStart
          const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.fetchStart
          const resourceLoadTime = perfData.loadEventEnd - perfData.domContentLoadedEventEnd
          
          console.log('⚡ Performance Metrics:')
          console.log(`  Page Load Time: ${pageLoadTime.toFixed(2)}ms`)
          console.log(`  DOM Content Loaded: ${domContentLoaded.toFixed(2)}ms`)
          console.log(`  Resource Load Time: ${resourceLoadTime.toFixed(2)}ms`)
          
          // Log to analytics if needed
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'timing_complete', {
              name: 'page_load',
              value: Math.round(pageLoadTime),
            })
          }
        }
      })

      // Monitor API calls performance
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && entry.name.includes('/api/')) {
            const resource = entry as PerformanceResourceTiming
            console.log(`🌐 API Call: ${entry.name} - ${resource.duration.toFixed(2)}ms`)
          }
        }
      })

      observer.observe({ entryTypes: ['resource'] })

      return () => observer.disconnect()
    }
  }, [])

  return null
}
