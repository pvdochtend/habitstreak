'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiResponse } from '@/types'
import { Loader2, LogOut } from 'lucide-react'

interface UserData {
  id: string
  email: string
  dailyTarget: number
  streakFreezes: number
  createdAt: string
}

export default function InstellingenPage() {
  const router = useRouter()
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

  const handleSave = async (e: React.FormEvent) => {
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
      setSuccessMessage('Instellingen opgeslagen!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 animate-fade-in">
        <div className="h-9 w-40 bg-muted rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 rounded-lg border bg-card">
            <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="p-4">
        <Card className="bg-destructive/10 border-destructive">
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

      {/* Account Info */}
      <Card className="animate-slide-up hover:shadow-md transition-shadow duration-200">
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
      <Card className="animate-slide-up hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Dagelijks doel</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {successMessage && (
              <div className="bg-green-50 text-green-800 text-sm p-3 rounded-md border border-green-200">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dailyTarget">
                Aantal taken per dag om je doel te behalen
              </Label>
              <Input
                id="dailyTarget"
                type="number"
                min={1}
                max={100}
                value={dailyTarget}
                onChange={(e) => setDailyTarget(parseInt(e.target.value) || 1)}
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Een dag is succesvol als je dit aantal taken of meer voltooit.
              </p>
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="animate-slide-up hover:shadow-md transition-shadow duration-200">
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full touch-target hover:shadow-lg transition-shadow"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Uitloggen
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
