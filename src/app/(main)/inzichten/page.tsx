'use client'

import { useEffect, useState } from 'react'
import { WeeklyChart } from '@/components/insights/weekly-chart'
import { StreakCard } from '@/components/insights/streak-card'
import { Card, CardContent } from '@/components/ui/card'
import { InsightsData, ApiResponse } from '@/types'
import { Loader2 } from 'lucide-react'
import { PageTransition } from '@/components/ui/page-transition'

export default function InzichtenPage() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/insights?range=7d')
        const result: ApiResponse<InsightsData> = await response.json()

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

    fetchInsights()
  }, [])

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 animate-fade-in">
        <div className="h-9 w-32 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-lg border bg-card">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="h-6 w-40 bg-muted rounded animate-pulse mb-4" />
          <div className="space-y-4">
            <div className="flex justify-between items-end h-48">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="w-8 bg-muted rounded animate-pulse"
                  style={{ height: `${Math.random() * 100 + 50}px` }}
                />
              ))}
            </div>
          </div>
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
      {/* Header */}
      <h1 className="text-3xl font-bold animate-slide-up">Inzichten</h1>

      {/* Streak Cards */}
      <div className="grid grid-cols-2 gap-4 animate-slide-up">
        <StreakCard type="current" value={data.currentStreak} />
        <StreakCard type="best" value={data.bestStreak} />
      </div>

      {/* Weekly Chart */}
      <div className="animate-slide-up">
        <WeeklyChart days={data.days} dailyTarget={data.dailyTarget} />
      </div>

      {/* Summary Stats */}
      <Card className="animate-slide-up">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Samenvatting</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dagen voltooid</span>
              <span className="font-semibold">
                {data.days.filter((d) => d.isSuccessful).length} / 7
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Totaal taken voltooid</span>
              <span className="font-semibold">
                {data.days.reduce((sum, d) => sum + d.completedCount, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dagelijks doel</span>
              <span className="font-semibold">{data.dailyTarget}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  )
}
