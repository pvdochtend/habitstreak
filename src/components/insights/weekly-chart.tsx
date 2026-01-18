'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DayInsight } from '@/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface WeeklyChartProps {
  days: DayInsight[]
  dailyTarget: number
}

export function WeeklyChart({ days, dailyTarget }: WeeklyChartProps) {
  // Transform data for chart
  const chartData = days.map((day) => {
    const date = new Date(day.date)
    const dayName = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'][date.getDay()]

    return {
      name: dayName,
      completed: day.completedCount,
      isSuccessful: day.isSuccessful,
    }
  })

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Afgelopen 7 dagen</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null

                const data = payload[0].payload
                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.completed} taken voltooid
                    </p>
                    {data.isSuccessful && (
                      <p className="text-sm text-green-600 font-medium">✓ Doel behaald</p>
                    )}
                  </div>
                )
              }}
            />
            <ReferenceLine
              y={dailyTarget}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                value: `Doel: ${dailyTarget}`,
                position: 'right',
                fill: '#ef4444',
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="completed"
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
