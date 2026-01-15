'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { ColorScheme } from '@/types'

type Theme = {
  colorScheme: ColorScheme
  darkMode: boolean
}

type ThemeContextType = {
  colorScheme: ColorScheme
  darkMode: boolean
  setColorScheme: (scheme: ColorScheme) => void
  setDarkMode: (enabled: boolean) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Storage keys
const STORAGE_KEY_COLOR = 'habitstreak-color-scheme'
const STORAGE_KEY_DARK = 'habitstreak-dark-mode'

export function ThemeProvider({
  children,
  initialColorScheme = 'blue',
  initialDarkMode = false,
}: {
  children: ReactNode
  initialColorScheme?: ColorScheme
  initialDarkMode?: boolean
}) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(initialColorScheme)
  const [darkMode, setDarkModeState] = useState(initialDarkMode)
  const [isLoading, setIsLoading] = useState(true)

  // Load theme from localStorage on mount, or from database if localStorage is empty
  useEffect(() => {
    const loadTheme = async () => {
      const storedColor = localStorage.getItem(STORAGE_KEY_COLOR) as ColorScheme | null
      const storedDark = localStorage.getItem(STORAGE_KEY_DARK)

      // If localStorage has theme, use it
      if (storedColor === 'blue' || storedColor === 'pink') {
        setColorSchemeState(storedColor)
      } else {
        // Otherwise, fetch from database (first login or new device)
        try {
          const response = await fetch('/api/user')
          const result = await response.json()
          if (result.success && result.data) {
            const dbColor = result.data.colorScheme as ColorScheme
            if (dbColor === 'blue' || dbColor === 'pink') {
              setColorSchemeState(dbColor)
              localStorage.setItem(STORAGE_KEY_COLOR, dbColor)
            }
            if (result.data.darkMode !== undefined) {
              setDarkModeState(result.data.darkMode)
              localStorage.setItem(STORAGE_KEY_DARK, result.data.darkMode.toString())
            }
          }
        } catch (error) {
          console.error('Failed to load theme from database:', error)
        }
      }

      if (storedDark !== null) {
        setDarkModeState(storedDark === 'true')
      }

      setIsLoading(false)
    }

    loadTheme()
  }, [])

  // Apply theme classes to html element
  useEffect(() => {

    const html = document.documentElement

    // Remove all theme classes
    html.classList.remove('light', 'dark', 'blue', 'pink')

    // Add current theme classes
    html.classList.add(darkMode ? 'dark' : 'light')
    html.classList.add(colorScheme)

    // Update meta theme-color for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      // Use primary color for theme-color
      const primaryColor = darkMode
        ? (colorScheme === 'pink' ? '#E879A6' : '#60A5FA')  // Lighter shades for dark mode
        : (colorScheme === 'pink' ? '#E11D74' : '#3B82F6')  // Original shades for light
      themeColorMeta.setAttribute('content', primaryColor)
    }
  }, [colorScheme, darkMode, isLoading])

  const setColorScheme = useCallback(async (scheme: ColorScheme) => {
    setColorSchemeState(scheme)
    localStorage.setItem(STORAGE_KEY_COLOR, scheme)

    // Persist to database
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorScheme: scheme }),
      })
    } catch (error) {
      console.error('Failed to save color scheme:', error)
    }
  }, [])

  const setDarkMode = useCallback(async (enabled: boolean) => {
    setDarkModeState(enabled)
    localStorage.setItem(STORAGE_KEY_DARK, enabled.toString())

    // Persist to database
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ darkMode: enabled }),
      })
    } catch (error) {
      console.error('Failed to save dark mode:', error)
    }
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        darkMode,
        setColorScheme,
        setDarkMode,
        isLoading
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
