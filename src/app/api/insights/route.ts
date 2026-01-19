import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { ApiResponse, InsightsData, DayInsight } from '@/types'
import { getLastNDays } from '@/lib/dates'
import { isTaskScheduledForDate } from '@/lib/schedule'
import { calculateCurrentStreak, calculateBestStreak, isDaySuccessful } from '@/lib/streak'
import { logger } from '@/lib/logger'

// ════════════════════════════════════
// GET /api/insights - Get 7-day insights
// ════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Get query params (future: support different ranges)
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    // For MVP, only support 7d
    const days = range === '7d' ? 7 : 7
    const last7Days = getLastNDays(days)

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
      select: {
        id: true,
        schedulePreset: true,
        daysOfWeek: true,
      },
    })

    // Get check-ins for the last 7 days
    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId: user.id,
        date: {
          in: last7Days,
        },
      },
      select: {
        date: true,
        taskId: true,
      },
    })

    // Build map of date -> completed count
    const completedByDate = new Map<string, number>()
    for (const checkIn of checkIns) {
      const count = completedByDate.get(checkIn.date) || 0
      completedByDate.set(checkIn.date, count + 1)
    }

    // Build insights for each day
    const dayInsights: DayInsight[] = last7Days.map((date) => {
      // Count scheduled tasks for this date
      const scheduledCount = tasks.filter((task) =>
        isTaskScheduledForDate(task.schedulePreset, task.daysOfWeek, date)
      ).length

      const completedCount = completedByDate.get(date) || 0

      return {
        date,
        completedCount,
        scheduledCount,
        isSuccessful: isDaySuccessful(completedCount, scheduledCount, dailyTarget),
      }
    })

    // Calculate streaks
    const currentStreak = await calculateCurrentStreak(user.id)
    const bestStreak = await calculateBestStreak(user.id)

    const data: InsightsData = {
      days: dayInsights,
      dailyTarget,
      currentStreak,
      bestStreak,
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data,
    })
  } catch (error) {
    logger.error('GET /api/insights error', error)

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
