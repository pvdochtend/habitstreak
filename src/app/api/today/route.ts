import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { ApiResponse, TodayData } from '@/types'
import { getTodayInAmsterdam } from '@/lib/dates'
import { isTaskScheduledForDate } from '@/lib/schedule'
import { logger } from '@/lib/logger'

// ════════════════════════════════════
// GET /api/today - Get today's tasks
// ════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const today = getTodayInAmsterdam()

    // Get user's daily target
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dailyTarget: true },
    })

    const dailyTarget = userRecord?.dailyTarget ?? 1

    // Get all active tasks
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        checkIns: {
          where: {
            date: today,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Filter tasks scheduled for today and map to TodayTask format
    const todayTasks = tasks
      .filter((task) =>
        isTaskScheduledForDate(task.schedulePreset, task.daysOfWeek, today)
      )
      .map((task) => ({
        id: task.id,
        title: task.title,
        icon: task.icon ?? undefined,
        isCompleted: task.checkIns.length > 0,
        checkInId: task.checkIns[0]?.id,
      }))

    const completedCount = todayTasks.filter((t) => t.isCompleted).length
    const totalCount = todayTasks.length

    const data: TodayData = {
      date: today,
      tasks: todayTasks,
      completedCount,
      totalCount,
      dailyTarget,
      isSuccessful: completedCount >= dailyTarget,
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data,
    })
  } catch (error) {
    logger.error('GET /api/today error', error)

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
