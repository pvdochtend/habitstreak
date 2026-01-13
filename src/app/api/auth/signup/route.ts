import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'
import { getClientIp } from '@/lib/ip-utils'
import { checkRateLimit, recordAttempt, RATE_LIMIT_CONFIG } from '@/lib/rate-limit'

const signupSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens bevatten'),
})

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  const userAgent = request.headers.get('user-agent') || undefined

  try {
    // ════════════════════════════════════════════════════════════
    // STEP 1: Check IP-based rate limit for signups
    // ════════════════════════════════════════════════════════════
    const rateLimit = await checkRateLimit(
      clientIp,
      'signup-ip',
      RATE_LIMIT_CONFIG.SIGNUP_IP.maxAttempts,
      RATE_LIMIT_CONFIG.SIGNUP_IP.windowMs
    )

    if (!rateLimit.allowed && rateLimit.error) {
      // Record failed signup attempt (rate limited)
      await recordAttempt(clientIp, 'ip', 'signup', false, clientIp, userAgent)

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: rateLimit.error,
        },
        { status: 429 }
      )
    }

    // ════════════════════════════════════════════════════════════
    // STEP 2: Existing signup logic
    // ════════════════════════════════════════════════════════════

    const body = await request.json()

    // Validate input
    const validation = signupSchema.safeParse(body)
    if (!validation.success) {
      // Record failed signup attempt (validation error)
      await recordAttempt(clientIp, 'ip', 'signup', false, clientIp, userAgent)

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      // Record failed signup attempt (duplicate email)
      await recordAttempt(clientIp, 'ip', 'signup', false, clientIp, userAgent)

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Dit e-mailadres is al geregistreerd',
        },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        dailyTarget: 1, // Default target
        streakFreezes: 0,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    })

    // ════════════════════════════════════════════════════════════
    // STEP 3: Record successful signup attempt
    // ════════════════════════════════════════════════════════════
    await recordAttempt(clientIp, 'ip', 'signup', true, clientIp, userAgent)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)

    // Record failed signup attempt (server error)
    await recordAttempt(clientIp, 'ip', 'signup', false, clientIp, userAgent)

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Er is een fout opgetreden bij het aanmaken van je account',
      },
      { status: 500 }
    )
  }
}
