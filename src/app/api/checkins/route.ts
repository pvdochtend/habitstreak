import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { ApiResponse } from '@/types'
import { isValidDateString } from '@/lib/dates'
import { isTaskScheduledForDate } from '@/lib/schedule'

// ════════════════════════════════════
// POST /api/checkins - Create check-in
// ════════════════════════════════════
const createCheckInSchema = z.object({
  taskId: z.string().min(1, 'Task ID is verplicht'),
  date: z.string().min(1, 'Datum is verplicht'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Validate input
    const validation = createCheckInSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      )
    }

    const { taskId, date } = validation.data

    // Validate date format
    if (!isValidDateString(date)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Ongeldige datum' },
        { status: 400 }
      )
    }

    // Check if task exists and belongs to user
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Taak niet gevonden' },
        { status: 404 }
      )
    }

    if (task.userId !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Geen toegang tot deze taak' },
        { status: 403 }
      )
    }

    // Check if task is active
    if (!task.isActive) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Taak is niet actief' },
        { status: 400 }
      )
    }

    // Verify task is scheduled for this date
    if (!isTaskScheduledForDate(task.schedulePreset, task.daysOfWeek, date)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Taak is niet gepland voor deze datum' },
        { status: 400 }
      )
    }

    // Check if check-in already exists
    const existingCheckIn = await prisma.checkIn.findUnique({
      where: {
        taskId_date: {
          taskId,
          date,
        },
      },
    })

    if (existingCheckIn) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Check-in bestaat al voor deze datum' },
        { status: 409 }
      )
    }

    // Create check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        userId: user.id,
        taskId,
        date,
        status: 'DONE',
      },
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: checkIn,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/checkins error:', error)

    if (error instanceof Error && error.message === 'Authenticatie vereist') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Er is een fout opgetreden bij het aanmaken van de check-in' },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════
// DELETE /api/checkins - Delete check-in
// ════════════════════════════════════
const deleteCheckInSchema = z.object({
  taskId: z.string().min(1, 'Task ID is verplicht'),
  date: z.string().min(1, 'Datum is verplicht'),
})

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Validate input
    const validation = deleteCheckInSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      )
    }

    const { taskId, date } = validation.data

    // Validate date format
    if (!isValidDateString(date)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Ongeldige datum' },
        { status: 400 }
      )
    }

    // Find check-in
    const checkIn = await prisma.checkIn.findUnique({
      where: {
        taskId_date: {
          taskId,
          date,
        },
      },
    })

    if (!checkIn) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Check-in niet gevonden' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (checkIn.userId !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Geen toegang tot deze check-in' },
        { status: 403 }
      )
    }

    // Delete check-in
    await prisma.checkIn.delete({
      where: {
        taskId_date: {
          taskId,
          date,
        },
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { taskId, date },
    })
  } catch (error) {
    console.error('DELETE /api/checkins error:', error)

    if (error instanceof Error && error.message === 'Authenticatie vereist') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Er is een fout opgetreden bij het verwijderen van de check-in' },
      { status: 500 }
    )
  }
}
