'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { ApiResponse } from '@/types'
import { AuthHeader } from '@/components/auth/auth-header'
import { AnimatedBackground } from '@/components/backgrounds/animated-background'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen')
      return
    }

    // Validate password length
    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens bevatten')
      return
    }

    setIsLoading(true)

    try {
      // Create account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data: ApiResponse = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Er is een fout opgetreden')
        setIsLoading(false)
        return
      }

      // Auto-login after successful signup
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (!signInResult) {
        setError('Er is een fout opgetreden. Probeer het opnieuw.')
        setIsLoading(false)
        return
      }

      if (signInResult.error) {
        // Signup succeeded but login failed - redirect to login page
        router.push('/login?message=Account aangemaakt. Log nu in.')
        setIsLoading(false)
        return
      }

      if (signInResult.ok) {
        router.push('/vandaag')
        router.refresh()
        return
      }

      setError('Er is een fout opgetreden. Probeer het opnieuw.')
      setIsLoading(false)
    } catch (err) {
      setError('Er is een fout opgetreden. Probeer het opnieuw.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      <Card className="w-full max-w-md shadow-xl animate-scale-in glass-strong">
        <CardHeader className="text-center">
          <AuthHeader
            title="Aan de slag!"
            subtitle="Maak een nieuw HabitStreak account"
          />
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                placeholder="naam@voorbeeld.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimaal 8 tekens"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Herhaal je wachtwoord"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                minLength={8}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full touch-target shadow-md hover:shadow-lg transition-shadow"
              disabled={isLoading}
            >
              {isLoading ? 'Account aanmaken...' : 'Account aanmaken'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Al een account?{' '}
              <Link
                href="/login"
                className="text-primary hover:underline font-semibold transition-all"
              >
                Log hier in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
