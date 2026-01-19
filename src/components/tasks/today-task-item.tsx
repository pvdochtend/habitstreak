'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { TodayTask } from '@/types'
import { getTaskIcon } from '@/lib/task-icons'
import { CelebrationEffect } from './celebration-effect'
import { AnimatedCheckmark } from '@/components/ui/animated-checkmark'
import { triggerHaptic } from '@/lib/haptics'
import { fireTaskConfetti } from '@/lib/confetti'

interface TodayTaskItemProps {
  task: TodayTask
  date: string
  onToggle: (taskId: string, isCompleted: boolean) => Promise<void>
}

export function TodayTaskItem({ task, date, onToggle }: TodayTaskItemProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [localIsCompleted, setLocalIsCompleted] = useState(task.isCompleted)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Sync local state with props when task.isCompleted changes
  useEffect(() => {
    setLocalIsCompleted(task.isCompleted)
  }, [task.isCompleted])

  const getConfettiOrigin = (): { x: number; y: number } | undefined => {
    if (!buttonRef.current) return undefined;

    const rect = buttonRef.current.getBoundingClientRect();
    // Calculate center of button as viewport ratio
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    return { x, y };
  };

  const handleToggle = async () => {
    // Blur to clear focus state after interaction (prevents sticky focus on mobile)
    buttonRef.current?.blur()

    const willComplete = !localIsCompleted

    // Optimistic update - flip visual state immediately
    setLocalIsCompleted(willComplete)

    if (willComplete) {
      // Trigger haptic immediately for instant feedback
      triggerHaptic('success')

      // Fire confetti from button position
      fireTaskConfetti(getConfettiOrigin())

      setIsAnimating(true)
      setShowCelebration(true)
    }

    setIsLoading(true)
    try {
      await onToggle(task.id, task.isCompleted)
    } catch {
      // Rollback on error
      setLocalIsCompleted(task.isCompleted)
    } finally {
      setIsLoading(false)
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
      ref={buttonRef}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-lg border touch-target animate-slide-up',
        'task-item-hover hover:shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)] active:scale-[0.98]',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-[background-color,border-color,transform,opacity] duration-500',
        isAnimating && 'animate-glow',
        localIsCompleted
          ? 'bg-primary/5 border-primary'
          : 'bg-card border-border'
      )}
      aria-label={`${task.title} - ${localIsCompleted ? 'Voltooid' : 'Niet voltooid'}`}
      aria-pressed={localIsCompleted}
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
                localIsCompleted ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          )
        })()}

        {/* Checkbox */}
        <div
          className={cn(
            'flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200',
            localIsCompleted
              ? 'bg-primary border-primary scale-110'
              : 'bg-background border-muted-foreground hover:border-primary/50',
            isAnimating && 'animate-checkbox-fill'
          )}
        >
          {localIsCompleted && (
            <AnimatedCheckmark
              isChecked={localIsCompleted}
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
          localIsCompleted && 'line-through text-muted-foreground'
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
