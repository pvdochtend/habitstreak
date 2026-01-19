import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export default {
  trustHost: true, // KEY: Dynamic URL detection from Host header
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // authorize NOT defined here - in auth.ts (requires database, not edge-compatible)
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const publicPaths = ['/login', '/signup']
      const isPublicPath = publicPaths.some(path =>
        nextUrl.pathname.startsWith(path)
      )

      if (!isLoggedIn && !isPublicPath) {
        return false // Redirect to signIn
      }
      return true
    },
  },
} satisfies NextAuthConfig
