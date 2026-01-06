import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { ApiResponse } from '@/types'
import { SchedulePreset } from '@prisma/client'
import { isValidDaysOfWeek } from '@/lib/schedule'

// ════════════════════════════════════
// GET /api/tasks - List all tasks
// ════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Get query params
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Query tasks
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [
        { isActive: 'desc' }, // Active tasks first
        { createdAt: 'desc' }, // Newest first
      ],
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: tasks,
    })
  } catch (error) {
    console.error('GET /api/tasks error:', error)

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
// POST /api/tasks - Create new task
// ════════════════════════════════════
const createTaskSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht').max(255, 'Titel is te lang'),
  schedulePreset: z.nativeEnum(SchedulePreset, {
    errorMap: () => ({ message: 'Ongeldig schema' }),
  }),
  daysOfWeek: z.array(z.number()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Validate input
    const validation = createTaskSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      )
    }

    const { title, schedulePreset, daysOfWeek = [] } = validation.data

    // Validate CUSTOM preset has valid days
    if (schedulePreset === 'CUSTOM') {
      if (!daysOfWeek || daysOfWeek.length === 0) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Aangepast schema vereist minstens één dag',
          },
          { status: 400 }
        )
      }

      if (!isValidDaysOfWeek(daysOfWeek)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Ongeldige dagen geselecteerd',
          },
          { status: 400 }
        )
      }
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: title.trim(),
        schedulePreset,
        daysOfWeek: schedulePreset === 'CUSTOM' ? daysOfWeek : [],
        isActive: true,
      },
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: task,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/tasks error:', error)

    if (error instanceof Error && error.message === 'Authenticatie vereist') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Er is een fout opgetreden bij het aanmaken van de taak' },
      { status: 500 }
    )
  }
}
