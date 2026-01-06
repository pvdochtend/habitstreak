import { Card, CardContent } from '@/components/ui/card'
import { Flame, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakCardProps {
  type: 'current' | 'best'
  value: number
}

export function StreakCard({ type, value }: StreakCardProps) {
  const isCurrent = type === 'current'

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-3">
          <div
            className={cn(
              'p-3 rounded-full w-fit transition-transform hover:scale-110 duration-200',
              isCurrent
                ? 'bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600'
                : 'bg-gradient-to-br from-yellow-100 to-yellow-50 text-yellow-600'
            )}
          >
            {isCurrent ? (
              <Flame className="h-6 w-6" strokeWidth={2.5} />
            ) : (
              <Trophy className="h-6 w-6" strokeWidth={2.5} />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              {isCurrent ? 'Huidige streak' : 'Beste streak'}
            </p>
            <p className="text-2xl font-bold mt-1">
              {value} <span className="text-lg font-normal text-muted-foreground">{value === 1 ? 'dag' : 'dagen'}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
