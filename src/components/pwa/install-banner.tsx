'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { usePwaInstall } from '@/contexts/pwa-install-context'
import { Button } from '@/components/ui/button'
import { IosWalkthroughModal } from './ios-walkthrough-modal'

/**
 * Fixed bottom install banner for PWA installation
 * Shows platform-appropriate CTA after 2.5s delay
 *
 * - iOS Safari: "Zo werkt het" button opens walkthrough modal
 * - Chromium: "Installeren" button triggers native install prompt
 * - Unsupported: Banner is not shown
 *
 * Banner respects dismissal state from PwaInstallProvider
 */
export function InstallBanner() {
  const { platform, canInstall, isLoading, triggerInstall, dismiss } = usePwaInstall()
  const [isVisible, setIsVisible] = useState(false)
  const [showWalkthrough, setShowWalkthrough] = useState(false)

  // Show banner when canInstall becomes true
  useEffect(() => {
    if (!isLoading && canInstall) {
      setIsVisible(true)
    }
  }, [isLoading, canInstall])

  // Handle install action
  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowWalkthrough(true)
    } else {
      const result = await triggerInstall()
      if (result?.outcome === 'accepted') {
        setIsVisible(false)
      }
    }
  }

  // Handle dismiss action
  const handleDismiss = async () => {
    setIsVisible(false)
    await dismiss()
  }

  // Don't render if not visible
  if (!isVisible) {
    return null
  }

  return (
    <>
      {/* Fixed bottom banner with delayed slide-up animation */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-safe animate-slide-up"
        style={{ animationDelay: '2.5s', animationFillMode: 'backwards' }}
      >
        <div className="glass-subtle rounded-lg p-4 flex items-center gap-4 max-w-lg mx-auto">
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Installeer de app</p>
            <p className="text-xs text-muted-foreground">
              {platform === 'ios'
                ? 'Voeg toe aan je beginscherm'
                : 'Snelle toegang vanaf je beginscherm'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Primary action */}
            <Button
              size="sm"
              className="touch-target"
              onClick={handleInstall}
            >
              {platform === 'ios' ? 'Zo werkt het' : 'Installeren'}
            </Button>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="touch-target flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only">Niet nu</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS walkthrough modal */}
      <IosWalkthroughModal
        open={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
      />
    </>
  )
}
