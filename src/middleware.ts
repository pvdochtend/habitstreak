import NextAuth from 'next-auth'
import authConfig from '@/lib/auth.config'

// Use edge-compatible config (no database adapter)
const { auth } = NextAuth(authConfig)

export default auth

// Protect all routes except auth pages and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login, /signup (auth pages)
     * - /api (API routes handle their own auth)
     * - /_next (Next.js internals)
     * - /favicon.ico, /manifest.json, etc. (static files)
     */
    '/((?!login|signup|api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)',
  ],
}
