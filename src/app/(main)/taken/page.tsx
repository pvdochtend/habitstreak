'use client'

import { useEffect, useState } from 'react'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskListItem } from '@/components/tasks/task-list-item'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Task, ApiResponse } from '@/types'
import { Plus, Loader2 } from 'lucide-react'

export default function TakenPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const result: ApiResponse<Task[]> = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fout bij ophalen van taken')
      }

      setTasks(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Fout bij verwijderen van taak')
      }

      await fetchTasks()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    }
  }

  const handleToggleActive = async (taskId: string, currentlyActive: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentlyActive }),
      })

      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Fout bij bijwerken van taak')
      }

      await fetchTasks()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    }
  }

  const handleFormSuccess = () => {
    setEditingTask(undefined)
    fetchTasks()
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTask(undefined)
  }

  const activeTasks = tasks.filter((t) => t.isActive)
  const archivedTasks = tasks.filter((t) => !t.isActive)

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="h-9 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-lg border bg-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-10 w-10 bg-muted rounded animate-pulse" />
                  <div className="h-10 w-10 bg-muted rounded animate-pulse" />
                  <div className="h-10 w-10 bg-muted rounded animate-pulse" />
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

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <h1 className="text-3xl font-bold">Taken</h1>
        <Button onClick={() => { setEditingTask(undefined); setShowForm(true); }} className="touch-target shadow-sm hover:shadow-md transition-shadow">
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe taak
        </Button>
      </div>

      {/* Active Tasks */}
      <div className="space-y-3 animate-slide-up">
        <h2 className="text-lg font-semibold">Actieve taken</h2>
        {activeTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Je hebt nog geen taken aangemaakt.
              </p>
              <Button
                onClick={() => { setEditingTask(undefined); setShowForm(true); }}
                variant="outline"
                className="mt-4"
              >
                Maak je eerste taak
              </Button>
            </CardContent>
          </Card>
        ) : (
          activeTasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))
        )}
      </div>

      {/* Archived Tasks */}
      {archivedTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Gearchiveerde taken
          </h2>
          {archivedTasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Task Form Dialog */}
      <TaskForm
        key={editingTask?.id || 'new'}
        task={editingTask}
        open={showForm}
        onOpenChange={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
