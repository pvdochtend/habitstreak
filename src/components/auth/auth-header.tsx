'use client'

import { Flame } from 'lucide-react'

/**
 * AuthHeader - Branding header for authentication pages
 *
 * Features:
 * - Flame icon with orange color and subtle glow animation
 * - HabitStreak app name
 * - Customizable title and subtitle for page-specific messaging
 * - Staggered animations matching landing page pattern
 */
interface AuthHeaderProps {
  title: string        // e.g., "Welkom terug!" or "Aan de slag!"
  subtitle: string     // e.g., "Log in op je HabitStreak account"
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-3 pb-4">
      {/* Flame icon with glow */}
      <div
        className="animate-fade-in"
        style={{ animationDelay: '0.05s', animationFillMode: 'backwards' }}
      >
        <div className="relative">
          <Flame
            className="h-12 w-12 text-orange-500 animate-flame-flicker animate-flame-glow"
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* App name */}
      <h2
        className="text-xl font-bold tracking-tight text-foreground animate-slide-up"
        style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
      >
        HabitStreak
      </h2>

      {/* Welcoming message (title) */}
      <h1
        className="text-2xl font-bold text-foreground animate-slide-up"
        style={{ animationDelay: '0.15s', animationFillMode: 'backwards' }}
      >
        {title}
      </h1>

      {/* Description (subtitle) */}
      <p
        className="text-sm text-muted-foreground animate-slide-up"
        style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
      >
        {subtitle}
      </p>
    </div>
  )
}
