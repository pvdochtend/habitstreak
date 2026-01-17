'use client'

import { useEffect, useState } from 'react'
import { TodayTaskItem } from '@/components/tasks/today-task-item'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TodayData, ApiResponse } from '@/types'
import { Loader2 } from 'lucide-react'
import { PageTransition } from '@/components/ui/page-transition'
import { usePrevious } from '@/lib/hooks'
import { fireAllTasksConfetti } from '@/lib/confetti'
import { triggerHaptic } from '@/lib/haptics'

export default function VandaagPage() {
  const [data, setData] = useState<TodayData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track previous completedCount to detect when all tasks just completed
  const prevCompletedCount = usePrevious(data?.completedCount)

  // Derive celebration condition
  const allTasksComplete = data && data.totalCount > 0 && data.completedCount === data.totalCount
  const justCompletedAll = allTasksComplete &&
    prevCompletedCount !== undefined &&
    prevCompletedCount < data.totalCount

  // Fire celebration when all tasks just completed
  useEffect(() => {
    if (justCompletedAll) {
      fireAllTasksConfetti()
      triggerHaptic('success')
    }
  }, [justCompletedAll])

  const fetchTodayData = async () => {
    try {
      const response = await fetch('/api/today')
      const result: ApiResponse<TodayData> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fout bij ophalen van gegevens')
      }

      setData(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTodayData()
  }, [])

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    if (!data) return

    try {
      if (isCompleted) {
        // Uncheck - delete check-in
        const response = await fetch('/api/checkins', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, date: data.date }),
        })

        const result: ApiResponse = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Fout bij verwijderen check-in')
        }
      } else {
        // Check - create check-in
        const response = await fetch('/api/checkins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, date: data.date }),
        })

        const result: ApiResponse = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Fout bij aanmaken check-in')
        }
      }

      // Refresh data
      await fetchTodayData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 animate-fade-in">
        <div>
          <div className="h-9 w-32 bg-muted rounded animate-pulse mb-2" />
          <div className="h-2 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-4">
                <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <PageTransition className="p-4 space-y-6">
      {/* Header with Progress */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold mb-2">Vandaag</h1>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-secondary rounded-full h-2.5 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-primary to-primary/80 h-full transition-all duration-500 ease-out"
              style={{
                width: `${data.totalCount > 0 ? (data.completedCount / data.totalCount) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap min-w-[3rem] text-right">
            {data.completedCount} / {data.totalCount}
          </span>
        </div>
      </div>

      {/* Daily Target Card */}
      {data.totalCount > 0 && (
        <Card className="animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dagelijks doel</p>
                <p className="text-2xl font-bold">
                  {data.completedCount} / {data.dailyTarget}
                </p>
              </div>
              {data.isSuccessful ? (
                <div className="text-green-600 font-semibold text-lg flex items-center gap-2 animate-scale-in">
                  <span className="text-2xl">✓</span>
                  <span>Behaald!</span>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  Nog {data.dailyTarget - data.completedCount} te gaan
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      {data.tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Geen taken gepland voor vandaag.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Ga naar de Taken-pagina om nieuwe taken aan te maken.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Je taken</h2>
          {data.tasks.map((task) => (
            <TodayTaskItem
              key={task.id}
              task={task}
              date={data.date}
              onToggle={handleToggleTask}
            />
          ))}
        </div>
      )}
    </PageTransition>
  )
}
