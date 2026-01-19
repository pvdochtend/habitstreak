import { auth } from './auth'
import { AuthUser } from '@/types'

/**
 * Get the current authenticated user from the session
 * Returns null if not authenticated
 * Use this in Server Components and API routes
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email,
  }
}

/**
 * Require authentication - throws error if not authenticated
 * Use this in API routes that require authentication
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authenticatie vereist')
  }

  return user
}

/**
 * Check if user is authenticated
 * Returns boolean - useful for conditional rendering
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}
