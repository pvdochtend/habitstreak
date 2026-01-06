import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export function TaskListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end h-48">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="w-8" style={{ height: `${Math.random() * 100 + 50}px` }} />
        ))}
      </div>
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-4 w-8" />
        ))}
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="p-6 rounded-lg border bg-card">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  )
}
