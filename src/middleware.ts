import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

// Protect all routes except auth pages and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login, /signup (auth pages)
     * - /api (API routes)
     * - /_next (Next.js internals)
     * - /favicon.ico, /manifest.json, etc. (static files)
     */
    '/((?!login|signup|api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)',
  ],
}
