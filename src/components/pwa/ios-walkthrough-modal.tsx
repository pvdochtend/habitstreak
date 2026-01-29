'use client'

import { ArrowDown, PlusSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IosShareIcon } from './share-icon'

// ════════════════════════════════════
// TYPES
// ════════════════════════════════════
interface IosWalkthroughModalProps {
  open: boolean
  onClose: () => void
}

interface WalkthroughStepProps {
  step: number
  icon: React.ReactNode
  children: React.ReactNode
}

// ════════════════════════════════════
// COMPONENTS
// ════════════════════════════════════

/**
 * Individual step in the iOS walkthrough
 * Displays a numbered badge, icon, and instructional text
 */
function WalkthroughStep({ step, icon, children }: WalkthroughStepProps) {
  return (
    <div className="flex items-start gap-4">
      {/* Step number badge */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
        {step}
      </div>
      {/* Icon */}
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      {/* Text */}
      <div className="flex-1 pt-1 text-sm">{children}</div>
    </div>
  )
}

/**
 * iOS Safari Add to Home Screen walkthrough modal
 * Shows 3-step instructions for installing the PWA on iOS
 */
export function IosWalkthroughModal({ open, onClose }: IosWalkthroughModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Voeg toe aan beginscherm</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-5">
          <WalkthroughStep step={1} icon={<IosShareIcon className="w-6 h-6" />}>
            Tik op het <strong>Deel</strong> icoon in Safari
          </WalkthroughStep>

          <WalkthroughStep step={2} icon={<ArrowDown className="w-6 h-6" />}>
            Scroll naar beneden in het menu
          </WalkthroughStep>

          <WalkthroughStep step={3} icon={<PlusSquare className="w-6 h-6" />}>
            Tik op <strong>Zet op beginscherm</strong>
          </WalkthroughStep>
        </div>
      </DialogContent>
    </Dialog>
  )
}
