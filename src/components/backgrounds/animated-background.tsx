'use client'

import { useTheme } from '@/contexts/theme-context'

/**
 * AnimatedBackground - Theme-aware floating gradient orbs
 *
 * Renders 3 animated gradient orbs that float behind page content.
 * Colors adapt to current theme (blue/pink) and dark mode.
 * Pure CSS animations with GPU acceleration.
 * Respects prefers-reduced-motion for accessibility.
 */
export function AnimatedBackground() {
  const { colorScheme, darkMode } = useTheme()

  // Define orb colors based on theme using HSL values
  // HSL values avoid Tailwind JIT purging (can't detect dynamic class access)
  const orbColors = {
    blue: {
      orb1: 'hsl(217, 91%, 60%)',   // blue-400
      orb2: 'hsl(239, 84%, 67%)',   // indigo-400
      orb3: 'hsl(188, 95%, 43%)',   // cyan-400
    },
    pink: {
      orb1: 'hsl(330, 81%, 60%)',   // pink-400
      orb2: 'hsl(292, 91%, 73%)',   // fuchsia-400
      orb3: 'hsl(350, 89%, 60%)',   // rose-400
    },
  }

  // Adjust opacity based on dark mode
  const baseOpacity = darkMode ? 0.15 : 0.25
  const secondaryOpacity = darkMode ? 0.2 : 0.3
  const tertiaryOpacity = darkMode ? 0.15 : 0.2

  const colors = orbColors[colorScheme]

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    >
      {/* Large orb - top right */}
      <div
        className="absolute -top-20 -right-20 h-80 w-80 rounded-full blur-3xl animate-float-slow"
        style={{ backgroundColor: colors.orb1, opacity: baseOpacity }}
      />

      {/* Medium orb - left center */}
      <div
        className="absolute top-1/2 -left-16 h-64 w-64 rounded-full blur-3xl animate-float-medium"
        style={{ backgroundColor: colors.orb2, opacity: secondaryOpacity }}
      />

      {/* Small orb - bottom right */}
      <div
        className="absolute -bottom-16 right-1/4 h-48 w-48 rounded-full blur-2xl animate-float-fast"
        style={{ backgroundColor: colors.orb3, opacity: tertiaryOpacity }}
      />
    </div>
  )
}
