'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface CelebrationEffectProps {
  show: boolean
  onComplete?: () => void
}

export function CelebrationEffect({ show, onComplete }: CelebrationEffectProps) {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; color: string }>
  >([])

  useEffect(() => {
    if (!show) return

    // Generate confetti particles
    const colors = [
      'bg-primary',
      'bg-green-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-purple-500',
      'bg-blue-500',
    ]

    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100 - 50, // -50 to 50
      y: Math.random() * 30 + 10, // 10 to 40
      color: colors[Math.floor(Math.random() * colors.length)],
    }))

    setParticles(newParticles)

    // Cleanup after animation
    const timer = setTimeout(() => {
      setParticles([])
      onComplete?.()
    }, 800)

    return () => clearTimeout(timer)
  }, [show, onComplete])

  if (!show) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn('confetti-particle rounded-full animate-confetti', particle.color)}
          style={{
            left: `calc(50% + ${particle.x}px)`,
            top: `50%`,
            animationDelay: `${particle.id * 30}ms`,
          }}
        />
      ))}
    </div>
  )
}
