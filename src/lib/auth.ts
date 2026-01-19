import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from './prisma'
import { AuthUser } from '@/types'
import { getClientIp } from './ip-utils'
import {
  checkRateLimit,
  recordAttempt,
  isAccountLocked,
  lockAccount,
  countRecentFailures,
  RATE_LIMIT_CONFIG,
  DUTCH_ERRORS,
} from './rate-limit'

// Use different cookie names for dev vs prod to avoid session conflicts
// when running both on the same machine (cookies are scoped by domain, not port)
const cookiePrefix = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'

// Only use secure cookies if NEXTAUTH_URL explicitly sets https://
// If NEXTAUTH_URL is not set, trustHost will auto-detect and cookies default to insecure
// This allows HTTP access for self-hosted instances without SSL
const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false

export const authOptions: NextAuthOptions = {
  // Trust the Host header to auto-detect NEXTAUTH_URL
  // This allows access via localhost, IP address, or domain without hardcoding
  // Safe for self-hosted apps behind reverse proxies
  trustHost: true,

  cookies: {
    sessionToken: {
      name: `${cookiePrefix}.next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}.next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${cookiePrefix}.next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email en wachtwoord zijn verplicht')
        }

        const email = credentials.email.toLowerCase()
        const clientIp = getClientIp(req as any)
        const userAgent = req?.headers?.['user-agent']

        try {
          // ════════════════════════════════════════════════════════════
          // STEP 1: Check account lockout status
          // ════════════════════════════════════════════════════════════
          const lockoutInfo = await isAccountLocked(email)
          if (lockoutInfo.isLocked && lockoutInfo.remainingMinutes) {
            throw new Error(DUTCH_ERRORS.ACCOUNT_LOCKED(lockoutInfo.remainingMinutes))
          }

          // ════════════════════════════════════════════════════════════
          // STEP 2: Check email-based rate limit
          // ════════════════════════════════════════════════════════════
          const emailRateLimit = await checkRateLimit(
            email,
            'login-email',
            RATE_LIMIT_CONFIG.LOGIN_EMAIL.maxAttempts,
            RATE_LIMIT_CONFIG.LOGIN_EMAIL.windowMs
          )

          if (!emailRateLimit.allowed && emailRateLimit.error) {
            throw new Error(emailRateLimit.error)
          }

          // ════════════════════════════════════════════════════════════
          // STEP 3: Check IP-based rate limit
          // ════════════════════════════════════════════════════════════
          const ipRateLimit = await checkRateLimit(
            clientIp,
            'login-ip',
            RATE_LIMIT_CONFIG.LOGIN_IP.maxAttempts,
            RATE_LIMIT_CONFIG.LOGIN_IP.windowMs
          )

          if (!ipRateLimit.allowed && ipRateLimit.error) {
            throw new Error(ipRateLimit.error)
          }

          // ════════════════════════════════════════════════════════════
          // STEP 4: Existing authentication logic
          // ════════════════════════════════════════════════════════════

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user) {
            // Record failed attempt
            await recordAttempt(email, 'email', 'login', false, clientIp, userAgent)

            // Check if we need to trigger lockout
            const recentFailures = await countRecentFailures(
              email,
              RATE_LIMIT_CONFIG.LOGIN_EMAIL.windowMs
            )

            if (recentFailures >= RATE_LIMIT_CONFIG.LOCKOUT.threshold) {
              await lockAccount(email, RATE_LIMIT_CONFIG.LOCKOUT.durationMs)
            }

            throw new Error(DUTCH_ERRORS.INVALID_CREDENTIALS())
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          if (!isValidPassword) {
            // Record failed attempt
            await recordAttempt(email, 'email', 'login', false, clientIp, userAgent)

            // Check if we need to trigger lockout
            const recentFailures = await countRecentFailures(
              email,
              RATE_LIMIT_CONFIG.LOGIN_EMAIL.windowMs
            )

            if (recentFailures >= RATE_LIMIT_CONFIG.LOCKOUT.threshold) {
              await lockAccount(email, RATE_LIMIT_CONFIG.LOCKOUT.durationMs)
            }

            throw new Error(DUTCH_ERRORS.INVALID_CREDENTIALS())
          }

          // ════════════════════════════════════════════════════════════
          // STEP 5: Record successful attempt
          // ════════════════════════════════════════════════════════════
          await recordAttempt(email, 'email', 'login', true, clientIp, userAgent)

          // Return user object for session
          return {
            id: user.id,
            email: user.email,
          }
        } catch (error) {
          // Re-throw the error to be handled by NextAuth
          throw error
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
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
  },
  secret: process.env.NEXTAUTH_SECRET,
}
