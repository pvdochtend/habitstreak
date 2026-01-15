import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { ApiResponse } from '@/types'
import { SchedulePreset } from '@prisma/client'
import { isValidDaysOfWeek } from '@/lib/schedule'
import { logger } from '@/lib/logger'

// ════════════════════════════════════
// PATCH /api/tasks/[id] - Update task
// ════════════════════════════════════
const updateTaskSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht').max(255, 'Titel is te lang').optional(),
  schedulePreset: z.nativeEnum(SchedulePreset).optional(),
  daysOfWeek: z.array(z.number()).optional(),
  isActive: z.boolean().optional(),
  icon: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Validate input
    const validation = updateTaskSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      )
    }

    const { title, schedulePreset, daysOfWeek, isActive, icon } = validation.data

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!existingTask) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Taak niet gevonden' },
        { status: 404 }
      )
    }

    if (existingTask.userId !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Geen toegang tot deze taak' },
        { status: 403 }
      )
    }

    // Validate CUSTOM preset
    const finalPreset = schedulePreset ?? existingTask.schedulePreset
    const finalDaysOfWeek = daysOfWeek ?? existingTask.daysOfWeek

    if (finalPreset === 'CUSTOM') {
      if (!finalDaysOfWeek || finalDaysOfWeek.length === 0) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Aangepast schema vereist minstens één dag',
          },
          { status: 400 }
        )
      }

      if (!isValidDaysOfWeek(finalDaysOfWeek)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Ongeldige dagen geselecteerd',
          },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title.trim()
    if (schedulePreset !== undefined) updateData.schedulePreset = schedulePreset
    if (daysOfWeek !== undefined) updateData.daysOfWeek = daysOfWeek
    if (isActive !== undefined) updateData.isActive = isActive
    if (icon !== undefined) updateData.icon = icon

    // Update task
    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: task,
    })
  } catch (error) {
    logger.error('PATCH /api/tasks/[id] error', error)

    if (error instanceof Error && error.message === 'Authenticatie vereist') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Er is een fout opgetreden bij het bijwerken van de taak' },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════
// DELETE /api/tasks/[id] - Delete task
// ════════════════════════════════════
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!existingTask) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Taak niet gevonden' },
        { status: 404 }
      )
    }

    if (existingTask.userId !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Geen toegang tot deze taak' },
        { status: 403 }
      )
    }

    // Delete task (cascade deletes check-ins)
    await prisma.task.delete({
      where: { id: params.id },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { id: params.id },
    })
  } catch (error) {
    logger.error('DELETE /api/tasks/[id] error', error)

    if (error instanceof Error && error.message === 'Authenticatie vereist') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Er is een fout opgetreden bij het verwijderen van de taak' },
      { status: 500 }
    )
  }
}
