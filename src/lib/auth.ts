import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
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
import authConfig from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email en wachtwoord zijn verplicht')
        }

        const email = (credentials.email as string).toLowerCase()
        const clientIp = getClientIp(request as any)
        const userAgent = request?.headers?.get('user-agent') ?? undefined

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
            credentials.password as string,
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
})
