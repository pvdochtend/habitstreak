'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/contexts/theme-context'
import { ColorScheme } from '@/types'

interface ThemeInitializerProps {
  colorScheme: ColorScheme
  darkMode: boolean
}

export function ThemeInitializer({ colorScheme, darkMode }: ThemeInitializerProps) {
  const { setColorScheme, setDarkMode } = useTheme()
  const initialized = useRef(false)

  useEffect(() => {
    // Only initialize once on mount to avoid overriding user's manual theme changes
    if (!initialized.current) {
      setColorScheme(colorScheme)
      setDarkMode(darkMode)
      initialized.current = true
    }
  }, [colorScheme, darkMode, setColorScheme, setDarkMode])

  return null // This component doesn't render anything
}
