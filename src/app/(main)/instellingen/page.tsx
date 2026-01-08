'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ApiResponse, ColorScheme } from '@/types'
import { Loader2, LogOut, Palette, Moon, Sun, Check } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { cn } from '@/lib/utils'

interface UserData {
  id: string
  email: string
  dailyTarget: number
  streakFreezes: number
  colorScheme: ColorScheme
  darkMode: boolean
  createdAt: string
}

export default function InstellingenPage() {
  const router = useRouter()
  const { colorScheme, darkMode, setColorScheme, setDarkMode } = useTheme()
  const [user, setUser] = useState<UserData | null>(null)
  const [dailyTarget, setDailyTarget] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user')
        const result: ApiResponse<UserData> = await response.json()

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Fout bij ophalen van gegevens')
        }

        setUser(result.data)
        setDailyTarget(result.data.dailyTarget)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleSaveDailyTarget = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccessMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyTarget }),
      })

      const result: ApiResponse<UserData> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fout bij opslaan van instellingen')
      }

      setUser(result.data)
      setSuccessMessage('Dagelijks doel opgeslagen!')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setIsSaving(false)
    }
  }

  const handleColorSchemeChange = async (scheme: ColorScheme) => {
    setColorScheme(scheme)
    // Context handles API call
  }

  const handleDarkModeToggle = async (enabled: boolean) => {
    setDarkMode(enabled)
    // Context handles API call
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 animate-fade-in">
        <div className="h-9 w-40 bg-muted rounded-lg animate-shimmer" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 rounded-lg border bg-card shadow-sm">
            <div className="h-6 w-32 bg-muted rounded-lg animate-shimmer mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-3/4 bg-muted rounded animate-shimmer" />
              <div className="h-4 w-1/2 bg-muted rounded animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="p-4">
        <Card className="bg-destructive/10 border-destructive shadow-sm">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <h1 className="text-3xl font-bold animate-slide-up">Instellingen</h1>

      {/* Theme Settings */}
      <Card className="animate-slide-up hover-lift shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>Thema</CardTitle>
          </div>
          <CardDescription>
            Kies je favoriete kleurschema en licht/donker modus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Scheme Selector */}
          <div className="space-y-3">
            <Label>Kleurschema</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Blue Option */}
              <button
                onClick={() => handleColorSchemeChange('blue')}
                className={cn(
                  'relative p-4 rounded-lg border-2 transition-all duration-200 touch-target',
                  'flex flex-col items-center gap-3',
                  'hover:shadow-md active:scale-[0.97]',
                  colorScheme === 'blue'
                    ? 'border-[#3B82F6] bg-[#3B82F6]/5 shadow-md'
                    : 'border-border hover:border-[#3B82F6]/50'
                )}
              >
                {/* Color Preview Circle */}
                <div
                  className="w-12 h-12 rounded-full shadow-md"
                  style={{ backgroundColor: '#3B82F6' }}
                />
                <span className="font-medium">Blauw</span>

                {/* Checkmark */}
                {colorScheme === 'blue' && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-[#3B82F6] rounded-full flex items-center justify-center animate-scale-in">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>

              {/* Pink Option */}
              <button
                onClick={() => handleColorSchemeChange('pink')}
                className={cn(
                  'relative p-4 rounded-lg border-2 transition-all duration-200 touch-target',
                  'flex flex-col items-center gap-3',
                  'hover:shadow-md active:scale-[0.97]',
                  colorScheme === 'pink'
                    ? 'border-[#E11D74] bg-[#E11D74]/5 shadow-md'
                    : 'border-border hover:border-[#E11D74]/50'
                )}
              >
                {/* Color Preview Circle */}
                <div
                  className="w-12 h-12 rounded-full shadow-md"
                  style={{ backgroundColor: '#E11D74' }}
                />
                <span className="font-medium">Roze</span>

                {/* Checkmark */}
                {colorScheme === 'pink' && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-[#E11D74] rounded-full flex items-center justify-center animate-scale-in">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div className="space-y-3">
            <Label>Weergave</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Light Mode */}
              <button
                onClick={() => handleDarkModeToggle(false)}
                className={cn(
                  'relative p-4 rounded-lg border-2 transition-all duration-200 touch-target',
                  'flex flex-col items-center gap-3',
                  'hover:shadow-md active:scale-[0.97]',
                  !darkMode
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Sun className="h-8 w-8 text-amber-500" />
                <span className="font-medium">Licht</span>

                {!darkMode && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-scale-in">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </button>

              {/* Dark Mode */}
              <button
                onClick={() => handleDarkModeToggle(true)}
                className={cn(
                  'relative p-4 rounded-lg border-2 transition-all duration-200 touch-target',
                  'flex flex-col items-center gap-3',
                  'hover:shadow-md active:scale-[0.97]',
                  darkMode
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Moon className="h-8 w-8 text-indigo-600" />
                <span className="font-medium">Donker</span>

                {darkMode && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-scale-in">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Theme Preview Info */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              Thema wijzigingen worden direct toegepast
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="animate-slide-up hover-lift shadow-sm">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>E-mailadres</Label>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          </div>
          <div>
            <Label>Lid sinds</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('nl-NL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Daily Target Settings */}
      <Card className="animate-slide-up hover-lift shadow-sm">
        <CardHeader>
          <CardTitle>Dagelijks doel</CardTitle>
          <CardDescription>
            Hoeveel taken wil je per dag voltooien?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveDailyTarget} className="space-y-4">
            {successMessage && (
              <div className="bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 text-sm p-3 rounded-lg border border-green-200 dark:border-green-800 animate-slide-in-right">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {successMessage}
                </div>
              </div>
            )}
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dailyTarget">
                Aantal taken per dag
              </Label>
              <Input
                id="dailyTarget"
                type="number"
                min={1}
                max={100}
                value={dailyTarget}
                onChange={(e) => setDailyTarget(parseInt(e.target.value) || 1)}
                disabled={isSaving}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Een dag is succesvol als je dit aantal taken of meer voltooit.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full touch-target hover:shadow-md transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                'Opslaan'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="animate-slide-up hover-lift shadow-sm">
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full touch-target hover:shadow-lg transition-all"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Uitloggen
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
