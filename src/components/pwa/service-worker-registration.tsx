'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        if (process.env.NODE_ENV === 'development') {
          console.log('Service Worker registered:', registration.scope)
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }

    registerSW()
  }, [])

  return null
}
