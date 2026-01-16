'use client'

import { cn } from '@/lib/utils'

interface AnimatedCheckmarkProps {
  isChecked: boolean
  className?: string
  size?: number
}

/**
 * AnimatedCheckmark - SVG checkmark with stroke draw animation
 *
 * Animates the checkmark drawing itself using stroke-dasharray/stroke-dashoffset.
 * The animation triggers when isChecked becomes true.
 *
 * @param isChecked - Controls animation trigger
 * @param className - Additional CSS classes (for color, etc.)
 * @param size - Size in pixels (default: 16)
 */
export function AnimatedCheckmark({
  isChecked,
  className,
  size = 16,
}: AnimatedCheckmarkProps) {
  // SVG checkmark path length is approximately 30 units
  const pathLength = 30

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
      aria-hidden="true"
    >
      <polyline
        points="4 12 9 17 20 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: pathLength,
          strokeDashoffset: isChecked ? 0 : pathLength,
        }}
        className={cn(
          'transition-all',
          isChecked && 'animate-draw-checkmark'
        )}
      />
    </svg>
  )
}
