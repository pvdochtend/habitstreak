'use client'

import { useState } from 'react'
import { Smartphone } from 'lucide-react'
import { usePwaInstall } from '@/contexts/pwa-install-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IosWalkthroughModal } from './ios-walkthrough-modal'

/**
 * Settings page install card for PWA installation
 *
 * Unlike InstallBanner, this card:
 * - Does NOT respect isDismissed state (permanent fallback for users who dismissed banner)
 * - Does NOT use canInstall (which factors in dismissal)
 * - Has its own walkthrough modal state (doesn't call dismiss())
 *
 * Visibility: shown when !isLoading && !isStandalone && platform !== 'unsupported'
 */
export function InstallSettingsCard() {
  const { platform, isStandalone, isLoading, triggerInstall } = usePwaInstall()
  const [showWalkthrough, setShowWalkthrough] = useState(false)

  // Don't show if loading, already installed (standalone), or unsupported platform
  if (isLoading || isStandalone || platform === 'unsupported') {
    return null
  }

  // Handle install action
  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowWalkthrough(true)
    } else {
      // Chromium: trigger native prompt
      // Result handling optional - card stays visible until isStandalone becomes true
      await triggerInstall()
    }
  }

  // Platform-specific button text
  const buttonText = platform === 'ios'
    ? 'Voeg toe aan beginscherm'
    : 'Installeren'

  return (
    <>
      <Card className="glass animate-slide-up hover-lift shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle>Installeer de app</CardTitle>
          </div>
          <CardDescription>
            Open HabitStreak direct vanaf je startscherm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleInstall}
            className="w-full touch-target"
          >
            {buttonText}
          </Button>
        </CardContent>
      </Card>

      {/* iOS walkthrough modal */}
      <IosWalkthroughModal
        open={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
      />
    </>
  )
}
