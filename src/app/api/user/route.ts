import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { ApiResponse } from '@/types'

// ════════════════════════════════════
// GET /api/user - Get user profile
// ════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        dailyTarget: true,
        streakFreezes: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Gebruiker niet gevonden' },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('GET /api/user error:', error)

    if (error instanceof Error && error.message === 'Authenticatie vereist') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════
// PATCH /api/user - Update user settings
// ════════════════════════════════════
const updateUserSchema = z.object({
  dailyTarget: z
    .number()
    .int('Dagelijks doel moet een geheel getal zijn')
    .min(1, 'Dagelijks doel moet minimaal 1 zijn')
    .max(100, 'Dagelijks doel kan maximaal 100 zijn')
    .optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireAuth()
    const body = await request.json()

    // Validate input
    const validation = updateUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      )
    }

    const { dailyTarget } = validation.data

    // Build update data
    const updateData: any = {}
    if (dailyTarget !== undefined) updateData.dailyTarget = dailyTarget

    // Update user
    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        dailyTarget: true,
        streakFreezes: true,
        createdAt: true,
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('PATCH /api/user error:', error)

    if (error instanceof Error && error.message === 'Authenticatie vereist') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Er is een fout opgetreden bij het bijwerken van je instellingen' },
      { status: 500 }
    )
  }
}
