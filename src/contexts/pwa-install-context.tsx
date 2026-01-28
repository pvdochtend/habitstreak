'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { BeforeInstallPromptEvent, PwaPlatform } from '@/types'

// ════════════════════════════════════
// TYPES
// ════════════════════════════════════
type PwaInstallContextType = {
  platform: PwaPlatform
  isStandalone: boolean
  canInstall: boolean
  isDismissed: boolean
  isLoading: boolean
  triggerInstall: () => Promise<{ outcome: 'accepted' | 'dismissed' } | null>
  dismiss: () => Promise<void>
}

// ════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════
const STORAGE_KEY = 'habitstreak-pwa-dismissed'

// ════════════════════════════════════
// CONTEXT
// ════════════════════════════════════
const PwaInstallContext = createContext<PwaInstallContextType | undefined>(undefined)

// ════════════════════════════════════
// PLATFORM DETECTION
// ════════════════════════════════════

/**
 * Detect the PWA install platform
 * - 'ios': iOS Safari (supports Add to Home Screen via share menu)
 * - 'chromium': Chrome, Edge, Opera, Samsung Browser (supports beforeinstallprompt)
 * - 'unsupported': Firefox, desktop Safari, iOS in-app browsers
 */
function detectPwaPlatform(): PwaPlatform {
  if (typeof window === 'undefined') return 'unsupported'

  const ua = navigator.userAgent

  // Check if iOS (includes iPad with desktop UA via maxTouchPoints)
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  if (isIOS) {
    // Check for iOS in-app browsers (Chrome, Firefox, Opera, Edge on iOS)
    // These use WebKit but can't install PWAs
    if (/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)) {
      return 'unsupported'
    }
    // Safari on iOS supports Add to Home Screen
    return 'ios'
  }

  // Check for Chromium-based browsers (support beforeinstallprompt)
  // Chrome, Edge, Opera, Samsung Browser
  const isChromium = /Chrome|Chromium|Edg|OPR|SamsungBrowser/.test(ua)
  if (isChromium) {
    return 'chromium'
  }

  // Firefox, Safari on macOS, and other browsers don't support PWA install prompt
  return 'unsupported'
}

/**
 * Check if the app is running in standalone/PWA mode
 */
function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false

  // iOS Safari standalone mode
  if (navigator.standalone === true) {
    return true
  }

  // Chromium standalone or minimal-ui mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return true
  }

  return false
}

// ════════════════════════════════════
// PROVIDER
// ════════════════════════════════════
export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<PwaPlatform>('unsupported')
  const [isStandalone, setIsStandalone] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  // Initialize on mount
  useEffect(() => {
    // Detect platform
    const detectedPlatform = detectPwaPlatform()
    setPlatform(detectedPlatform)

    // Check standalone mode
    const standalone = checkIsStandalone()
    setIsStandalone(standalone)

    // Load dismissal state from localStorage (source of truth)
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true'
    setIsDismissed(dismissed)

    setIsLoading(false)
  }, [])

  // Listen for beforeinstallprompt event (Chromium only)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Store the event for later use
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      // Clear the deferred prompt
      setDeferredPrompt(null)
      setIsStandalone(true)

      // Persist installed state to database (write-only backup)
      fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pwaInstalled: true }),
      }).catch(() => {
        // Ignore errors - database sync is optional
      })
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Compute canInstall
  const canInstall = (() => {
    if (isStandalone) return false
    if (isDismissed) return false

    // Chromium: only if we have the deferred prompt
    if (platform === 'chromium') {
      return deferredPrompt !== null
    }

    // iOS: always show if not dismissed and not standalone
    if (platform === 'ios') {
      return true
    }

    return false
  })()

  // Trigger install prompt
  const triggerInstall = useCallback(async (): Promise<{ outcome: 'accepted' | 'dismissed' } | null> => {
    // For iOS, return null - UI layer should show walkthrough modal
    if (platform === 'ios') {
      return null
    }

    // For Chromium, trigger the native prompt
    if (platform === 'chromium' && deferredPrompt) {
      try {
        const result = await deferredPrompt.prompt()
        // Clear the prompt - can only be used once
        setDeferredPrompt(null)
        return result
      } catch {
        // Prompt failed
        setDeferredPrompt(null)
        return null
      }
    }

    return null
  }, [platform, deferredPrompt])

  // Dismiss the install prompt
  const dismiss = useCallback(async (): Promise<void> => {
    // Set localStorage immediately (source of truth)
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsDismissed(true)

    // Sync to database as write-only backup (for logged-in users)
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installPromptDismissed: true }),
      })
    } catch {
      // Ignore errors - localStorage is the source of truth
      // This might fail for unauthenticated users, which is expected
    }
  }, [])

  return (
    <PwaInstallContext.Provider
      value={{
        platform,
        isStandalone,
        canInstall,
        isDismissed,
        isLoading,
        triggerInstall,
        dismiss,
      }}
    >
      {children}
    </PwaInstallContext.Provider>
  )
}

// ════════════════════════════════════
// HOOK
// ════════════════════════════════════
export function usePwaInstall() {
  const context = useContext(PwaInstallContext)
  if (!context) {
    throw new Error('usePwaInstall must be used within PwaInstallProvider')
  }
  return context
}
