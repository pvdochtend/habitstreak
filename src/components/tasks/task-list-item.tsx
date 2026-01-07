'use client'

import { useState } from 'react'
import { Task } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Archive } from 'lucide-react'
import { getSchedulePresetLabel } from '@/lib/schedule'
import { cn } from '@/lib/utils'
import { getTaskIcon } from '@/lib/task-icons'

interface TaskListItemProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onToggleActive: (taskId: string, isActive: boolean) => void
}

export function TaskListItem({
  task,
  onEdit,
  onDelete,
  onToggleActive,
}: TaskListItemProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Weet je zeker dat je deze taak wilt verwijderen?')) {
      return
    }

    setIsLoading(true)
    try {
      await onDelete(task.id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async () => {
    setIsLoading(true)
    try {
      await onToggleActive(task.id, task.isActive)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md animate-slide-up',
      !task.isActive && 'opacity-60'
    )}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          {/* Icon + Content */}
          <div className="flex items-start gap-3 flex-1">
            {/* Task Icon */}
            {(() => {
              const TaskIcon = getTaskIcon(task.icon)
              return (
                <div
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    task.isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <TaskIcon className="h-5 w-5" />
                </div>
              )
            })()}

            {/* Text Content */}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{task.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {getSchedulePresetLabel(task.schedulePreset)}
              </p>
              {!task.isActive && (
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Gearchiveerd
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(task)}
              disabled={isLoading}
              title="Bewerken"
              className="hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleActive}
              disabled={isLoading}
              title={task.isActive ? 'Archiveren' : 'Activeren'}
              className="hover:bg-orange-100 hover:text-orange-600 transition-colors"
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isLoading}
              title="Verwijderen"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
