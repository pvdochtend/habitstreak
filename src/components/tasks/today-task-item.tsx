'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TodayTask } from '@/types'

interface TodayTaskItemProps {
  task: TodayTask
  date: string
  onToggle: (taskId: string, isCompleted: boolean) => Promise<void>
}

export function TodayTaskItem({ task, date, onToggle }: TodayTaskItemProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      await onToggle(task.id, task.isCompleted)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 touch-target animate-slide-up',
        'hover:bg-accent hover:shadow-md active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        task.isCompleted
          ? 'bg-primary/5 border-primary shadow-sm'
          : 'bg-card border-border'
      )}
      aria-label={`${task.title} - ${task.isCompleted ? 'Voltooid' : 'Niet voltooid'}`}
      aria-pressed={task.isCompleted}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200 flex-shrink-0',
          task.isCompleted
            ? 'bg-primary border-primary scale-110'
            : 'bg-background border-muted-foreground hover:border-primary/50'
        )}
      >
        {task.isCompleted && (
          <Check className="h-4 w-4 text-primary-foreground animate-checkmark" />
        )}
      </div>

      {/* Task Title */}
      <span
        className={cn(
          'text-left font-medium flex-1 transition-all duration-200',
          task.isCompleted && 'line-through text-muted-foreground'
        )}
      >
        {task.title}
      </span>
    </button>
  )
}
