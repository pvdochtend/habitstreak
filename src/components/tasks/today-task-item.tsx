'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TodayTask } from '@/types'
import { getTaskIcon } from '@/lib/task-icons'
import { CelebrationEffect } from './celebration-effect'
import { AnimatedCheckmark } from '@/components/ui/animated-checkmark'
import { triggerHaptic } from '@/lib/haptics'

interface TodayTaskItemProps {
  task: TodayTask
  date: string
  onToggle: (taskId: string, isCompleted: boolean) => Promise<void>
}

export function TodayTaskItem({ task, date, onToggle }: TodayTaskItemProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)

    // Trigger celebration when completing (not uncompleting)
    const willComplete = !task.isCompleted

    if (willComplete) {
      // Trigger haptic immediately for instant feedback
      triggerHaptic('success')

      setIsAnimating(true)
      setShowCelebration(true)

      // Wait for initial animation before API call
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    try {
      await onToggle(task.id, task.isCompleted)
    } finally {
      setIsLoading(false)

      // Reset animation states after completion
      if (willComplete) {
        setTimeout(() => {
          setIsAnimating(false)
          setShowCelebration(false)
        }, 800)
      }
    }
  }

  return (
    <div className="relative">
      <button
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 touch-target animate-slide-up',
        'hover:bg-accent hover:shadow-md active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isAnimating && 'animate-task-complete animate-glow',
        task.isCompleted
          ? 'bg-primary/5 border-primary shadow-sm'
          : 'bg-card border-border'
      )}
      aria-label={`${task.title} - ${task.isCompleted ? 'Voltooid' : 'Niet voltooid'}`}
      aria-pressed={task.isCompleted}
    >
      {/* Icon + Checkbox */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Task Icon */}
        {(() => {
          const TaskIcon = getTaskIcon(task.icon)
          return (
            <TaskIcon
              className={cn(
                'h-5 w-5 transition-colors',
                task.isCompleted ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          )
        })()}

        {/* Checkbox */}
        <div
          className={cn(
            'flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200',
            task.isCompleted
              ? 'bg-primary border-primary scale-110'
              : 'bg-background border-muted-foreground hover:border-primary/50',
            isAnimating && 'animate-checkbox-fill'
          )}
        >
          {task.isCompleted && (
            <AnimatedCheckmark
              isChecked={task.isCompleted}
              className="text-primary-foreground"
              size={16}
            />
          )}
        </div>
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

      {/* Celebration Effect */}
      <CelebrationEffect
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    </div>
  )
}
