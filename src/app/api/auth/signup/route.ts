import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

const signupSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens bevatten'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = signupSchema.safeParse(body)
    if (!validation.success) {
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

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Er is een fout opgetreden bij het aanmaken van je account',
      },
      { status: 500 }
    )
  }
}
