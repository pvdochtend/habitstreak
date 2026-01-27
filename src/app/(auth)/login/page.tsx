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
import { AuthHeader } from '@/components/auth/auth-header'
import { AnimatedBackground } from '@/components/backgrounds/animated-background'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // NextAuth v5 returns error types (not messages) to the client.
        // 'CredentialsSignin' = explicit credentials error
        // 'Configuration' = any error thrown in authorize() that isn't client-safe
        // Other types are possible but rare for credentials flow
        const isCredentialError = result.error === 'CredentialsSignin' || result.error === 'Configuration'
        const message = isCredentialError
          ? 'Ongeldige inloggegevens'
          : 'Er is een fout opgetreden. Probeer het opnieuw.'
        setError(message)
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        router.push('/vandaag')
        router.refresh()
        return
      }

      setError('Ongeldige inloggegevens')
      setIsLoading(false)
    } catch (err) {
      setError('Er is een fout opgetreden. Probeer het opnieuw.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      <Card className="w-full max-w-md shadow-xl animate-scale-in glass-strong">
        <CardHeader className="text-center">
          <AuthHeader
            title="Welkom terug!"
            subtitle="Log in op je HabitStreak account"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full touch-target shadow-md hover:shadow-lg transition-shadow"
              disabled={isLoading}
            >
              {isLoading ? 'Inloggen...' : 'Inloggen'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Nog geen account?{' '}
              <Link
                href="/signup"
                className="text-primary hover:underline font-semibold transition-all"
              >
                Registreer je hier
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
