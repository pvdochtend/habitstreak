'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface CelebrationEffectProps {
  show: boolean
  onComplete?: () => void
}

interface Particle {
  id: number
  angle: number      // Direction in radians (0 to 2π)
  distance: number   // How far to travel (25-45px) - close-range sparkle
  size: 'sm' | 'md'  // Smaller particles to complement canvas-confetti
  shape: 'circle' | 'square'
  color: string
  delay: number      // Stagger the start (0-100ms)
}

export function CelebrationEffect({ show, onComplete }: CelebrationEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!show) return

    // Vibrant particle colors
    const colors = [
      'bg-primary',
      'bg-green-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-purple-500',
      'bg-blue-500',
    ]

    // Generate particles in radial burst pattern
    // Reduced count (18 → 10) to complement canvas-confetti
    // Small, fast particles stay close for "sparkle" effect at checkbox
    const newParticles = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      angle: (i / 10) * Math.PI * 2 + (Math.random() * 0.3 - 0.15), // Radial with jitter
      distance: 25 + Math.random() * 20, // 25-45px (shorter range, close to checkbox)
      size: (['sm', 'md'] as const)[Math.floor(Math.random() * 2)], // Smaller particles only
      shape: (Math.random() > 0.3 ? 'circle' : 'square') as 'circle' | 'square',
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: i * 10, // Faster stagger (15ms → 10ms)
    }))

    setParticles(newParticles)

    // Cleanup after animation (800ms → 600ms for faster sparkle)
    const timer = setTimeout(() => {
      setParticles([])
      onComplete?.()
    }, 600)

    return () => clearTimeout(timer)
  }, [show, onComplete])

  if (!show) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn(
            'particle absolute',
            particle.shape === 'circle' ? 'rounded-full' : 'rotate-45',
            particle.color,
            particle.size === 'sm' ? 'w-1 h-1' : particle.size === 'md' ? 'w-1.5 h-1.5' : 'w-2 h-2'
          )}
          style={{
            '--particle-x': `${Math.cos(particle.angle) * particle.distance}px`,
            '--particle-y': `${Math.sin(particle.angle) * particle.distance}px`,
            left: '50%',
            top: '50%',
            animationDelay: `${particle.delay}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
