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
  distance: number   // How far to travel (30-80px)
  size: 'sm' | 'md' | 'lg'
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
    const newParticles = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      angle: (i / 18) * Math.PI * 2 + (Math.random() * 0.3 - 0.15), // Radial with jitter
      distance: 35 + Math.random() * 45, // 35-80px
      size: (['sm', 'md', 'lg'] as const)[Math.floor(Math.random() * 3)],
      shape: (Math.random() > 0.3 ? 'circle' : 'square') as 'circle' | 'square',
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: i * 15, // Stagger by 15ms each
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
